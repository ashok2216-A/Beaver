from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from custom_tools.duffel import DuffelClient

router = APIRouter(prefix="/custom_tools/duffel", tags=["Custom Tools - Duffel Flights"])

# Dependency to instantiate the DuffelClient dynamically using the Authorization header
def get_duffel_client(authorization: Optional[str] = Header(None, description="Bearer <duffel_api_token>")) -> DuffelClient:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. The agent requires a Duffel API key. Please reconnect your Duffel integration via the agent settings."
        )
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must start with 'Bearer '"
        )
    token = authorization.split("Bearer ", 1)[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token cannot be empty"
        )
    return DuffelClient(token)


# ─── PYDANTIC SCHEMAS ─────────────────────────────────────────────────────────

class SuggestPlacesRequest(BaseModel):
    query: str = Field(..., description="City or airport query term (e.g. 'London', 'Paris')")

class SearchFlightsRequest(BaseModel):
    origin: str = Field(..., description="3-letter IATA code of origin airport (e.g. 'LHR')")
    destination: str = Field(..., description="3-letter IATA code of destination airport (e.g. 'JFK')")
    departure_date: str = Field(..., description="Departure date in YYYY-MM-DD format")
    adults: int = Field(1, description="Number of adult passengers", ge=1, le=9)

class GetOfferDetailsRequest(BaseModel):
    offer_id: str = Field(..., description="Unique ID of the offer to retrieve details for")

class GetSeatMapsRequest(BaseModel):
    offer_id: str = Field(..., description="Unique ID of the offer to retrieve seat maps for")

class BookFlightRequest(BaseModel):
    offer_id: str = Field(..., description="Unique ID of the offer to book")
    passengers: List[dict] = Field(..., description="List of passenger details matching Duffel schema")
    amount: str = Field(..., description="Total price amount of the offer")
    currency: str = Field(..., description="Total price currency of the offer")
    payment_type: str = Field("balance", description="Duffel payment method (usually 'balance')")

class GetOrderRequest(BaseModel):
    order_id: str = Field(..., description="Unique ID of the order to retrieve")

class CreateCancellationQuoteRequest(BaseModel):
    order_id: str = Field(..., description="Unique ID of the order to cancel")

class ConfirmCancellationRequest(BaseModel):
    cancellation_quote_id: str = Field(..., description="Unique ID of the cancellation quote to confirm")


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@router.post("/suggest_places")
async def suggest_places(req: SuggestPlacesRequest, client: DuffelClient = Depends(get_duffel_client)):
    try:
        data = await client.suggest_places(req.query)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/search_flights")
async def search_flights(req: SearchFlightsRequest, client: DuffelClient = Depends(get_duffel_client)):
    try:
        data = await client.search_flights(req.origin, req.destination, req.departure_date, req.adults)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/get_offer_details")
async def get_offer_details(req: GetOfferDetailsRequest, client: DuffelClient = Depends(get_duffel_client)):
    try:
        data = await client.get_offer_details(req.offer_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/get_seat_maps")
async def get_seat_maps(req: GetSeatMapsRequest, client: DuffelClient = Depends(get_duffel_client)):
    try:
        data = await client.get_seat_maps(req.offer_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/book_flight")
async def book_flight(req: BookFlightRequest, client: DuffelClient = Depends(get_duffel_client)):
    try:
        data = await client.book_flight(req.offer_id, req.passengers, req.amount, req.currency, req.payment_type)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/get_order")
async def get_order(req: GetOrderRequest, client: DuffelClient = Depends(get_duffel_client)):
    try:
        data = await client.get_order(req.order_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/create_cancellation_quote")
async def create_cancellation_quote(req: CreateCancellationQuoteRequest, client: DuffelClient = Depends(get_duffel_client)):
    try:
        data = await client.create_cancellation_quote(req.order_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/confirm_cancellation")
async def confirm_cancellation(req: ConfirmCancellationRequest, client: DuffelClient = Depends(get_duffel_client)):
    try:
        data = await client.confirm_cancellation(req.cancellation_quote_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
