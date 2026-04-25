from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter(prefix="/api/dls", tags=["DLS Integration"])

DLS_BASE = "https://eservices.dls.moi.gov.cy/arcgis/rest/services/National"

@router.get("/villages/{dist_code}")
async def get_villages(dist_code: str):
    """
    Fetches the villages/municipalities for a given district code (1=Nicosia, 5=Limassol, etc.)
    """
    url = f"{DLS_BASE}/General_Search/MapServer/11/query"
    params = {
        "f": "json",
        "where": f"DIST_CODE={dist_code}",
        "outFields": "VIL_CODE,VIL_NM_E",
        "returnGeometry": "false"
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, params=params)
            data = response.json()
            if "features" in data:
                villages = [
                    {"code": str(f["attributes"]["VIL_CODE"]), "name": f["attributes"]["VIL_NM_E"]}
                    for f in data["features"]
                ]
                # Sort alphabetically
                villages.sort(key=lambda x: x["name"])
                return {"villages": villages}
            return {"villages": []}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DLS API Error: {str(e)}")

@router.get("/search-parcel")
async def search_parcel(dist_code: str, vil_code: str, parcel_no: str, block_no: str = "", quarter: str = ""):
    """
    Searches for a parcel and returns its SBPI (ParcelId).
    """
    url = f"{DLS_BASE}/CadastralMap_EN/MapServer/0/query"
    
    base_where = f"DIST_CODE={dist_code} AND VIL_CODE={vil_code} AND PARCEL_NBR='{parcel_no}'"
    
    # Try multiple where clauses if block is provided
    where_queries = []
    if block_no and block_no.strip():
        b = block_no.strip()
        where_queries.append(f"{base_where} AND BLOCK_NO='{b}'")
        where_queries.append(f"{base_where} AND BLOCK_NO='{b.zfill(2)}'") # try padded like '02'
    
    where_queries.append(base_where) # Fallback without block
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            for where_q in where_queries:
                params = {
                    "f": "json",
                    "where": where_q,
                    "outFields": "OBJECTID,SHAPE.AREA,PLAN_NBR",
                    "returnGeometry": "false"
                }
                response = await client.get(url, params=params)
                data = response.json()
                if "features" in data and len(data["features"]) > 0:
                    return {"parcel": data["features"][0]["attributes"]}
            
            return {"error": "Parcel not found"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DLS API Error: {str(e)}")

@router.get("/parcel-info/{sbpi}")
async def get_parcel_info(sbpi: str):
    """
    Fetches the zoning and fiscal information (valuation) for the SBPI.
    """
    identify_url = "https://eservices.dls.moi.gov.cy/Services/Rest/Info/GeneralParcelIdentify"
    fiscal_url = "https://eservices.dls.moi.gov.cy/Services/Rest/Info/GetParcelUnitFiscalInformation"
    
    result = {}
    
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        try:
            # 1. Fetch Zoning and General Info
            res1 = await client.get(identify_url, params={"subPropertyId": sbpi})
            if res1.status_code == 200:
                data1 = res1.json()
                entry = data1[0] if isinstance(data1, list) and len(data1) > 0 else data1
                if entry:
                    result["propertyKind"] = entry.get("PrSubPropertyKindNameEn")
                    result["extents"] = entry.get("PrExtents") or entry.get("PrParcelExtent")
                    pz = entry.get("PrPlanningZone")
                    if pz:
                        result["zoneCode"] = pz.get("PrName")
                        result["density"] = pz.get("PrDensityRateQty")
                        result["coverage"] = pz.get("PrCoverageRate")
                        result["maxFloors"] = pz.get("PrStoreyNoQty")
                        result["maxHeight"] = pz.get("PrHeightMSR")
            
            # 2. Fetch Fiscal (Valuation 2021)
            res2 = await client.get(fiscal_url, params={"parcelId": sbpi})
            if res2.status_code == 200:
                data2 = res2.json()
                fiscal_arr = data2.get("parcelFiscalData", [])
                for item in fiscal_arr:
                    # 'Pclvalue2021code' or 'Pclvalue13code' usually holds the General Valuation
                    # The exact field code in DLS is often 'Pclvalue21code' for 2021 valuation
                    if item.get("DbFieldNameCode") == "Pclvalue21code" or "2021" in str(item.get("DbFieldNameCodeEnDescr")):
                        result["generalValuation2021"] = item.get("ActValueGrDescr") or item.get("FisValue")
                    if item.get("DbFieldNameCode") == "Pclaccesstcode":
                        result["accessType"] = item.get("ActValueGrDescr")
                    if item.get("DbFieldNameCode") == "Pclshapetcode":
                        result["shape"] = item.get("ActValueGrDescr")

            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DLS API Error: {str(e)}")
