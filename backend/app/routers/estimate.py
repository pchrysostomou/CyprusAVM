from fastapi import APIRouter, HTTPException
from app.models.schemas import PropertyInput, ValuationResult
from app.ml.model import get_model

router = APIRouter()


@router.post("/estimate", response_model=ValuationResult)
async def estimate_property(prop: PropertyInput):
    """
    Estimate property value based on characteristics.
    Returns price estimate, confidence interval, and factor breakdown.
    """
    try:
        model = get_model()
        if not model._loaded:
            raise HTTPException(
                status_code=503,
                detail="Model not loaded. Run scripts/train_model.py first.",
            )

        result = model.predict(prop.model_dump())
        return ValuationResult(**result)

    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Valuation error: {str(e)}")
