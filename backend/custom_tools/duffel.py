import httpx
import logging

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


class DuffelClient:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://api.duffel.com"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Duffel-Version": "v2",
            "Content-Type": "application/json"
        }

    async def suggest_places(self, query: str):
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{self.base_url}/places/suggestions",
                headers=self.headers,
                params={"query": query},
                timeout=20.0
            )
            r.raise_for_status()
            return r.json().get("data", [])

    async def search_flights(self, origin, destination, departure_date, adults=1):
        payload = {
            "data": {
                "slices": [{
                    "origin": origin,
                    "destination": destination,
                    "departure_date": departure_date
                }],
                "passengers": [{"type": "adult"} for _ in range(adults)],
                "cabin_class": "economy"
            }
        }

        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.base_url}/air/offer_requests",
                headers=self.headers,
                json=payload,
                timeout=60.0
            )
            r.raise_for_status()

            offer_request_id = r.json()["data"]["id"]

            r2 = await client.get(
                f"{self.base_url}/air/offer_requests/{offer_request_id}",
                headers=self.headers,
                timeout=60.0
            )
            r2.raise_for_status()

            offers = r2.json()["data"].get("offers", [])

            import re

            def format_duration(iso_duration: str | None) -> str:
                if not iso_duration:
                    return ""
                match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?', iso_duration)
                if not match:
                    return iso_duration
                h, m = match.groups()
                parts = []
                if h:
                    parts.append(f"{h} hr")
                if m:
                    parts.append(f"{m} min")
                return " ".join(parts) if parts else "0 min"

            def get_duration_minutes(iso_duration: str | None) -> int:
                if not iso_duration:
                    return 0
                match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?', iso_duration)
                if not match:
                    return 0
                h, m = match.groups()
                total = 0
                if h:
                    total += int(h) * 60
                if m:
                    total += int(m)
                return total

            def format_time(iso_datetime: str | None) -> str:
                if not iso_datetime:
                    return ""
                if "T" in iso_datetime:
                    time_part = iso_datetime.split("T")[1]
                    return ":".join(time_part.split(":")[:2])
                return iso_datetime

            clean_offers = []
            for o in offers:
                if not o.get("id") or not o.get("total_amount"):
                    continue
                
                offer_slices = []
                for s in o.get("slices", []):
                    segments = s.get("segments", [])
                    if not segments:
                        continue
                    first_seg = segments[0]
                    last_seg = segments[-1]
                    
                    dep_time = format_time(first_seg.get("departing_at"))
                    arr_time = format_time(last_seg.get("arriving_at"))
                    dur_minutes = get_duration_minutes(s.get("duration"))
                    dur_label = format_duration(s.get("duration"))
                    
                    stops_count = len(segments) - 1
                    stops_text = "Non-stop" if stops_count == 0 else "1 stop" if stops_count == 1 else f"{stops_count} stops"
                    
                    # Calculate carbon emissions: ~0.65 kg per flight minute if not provided
                    emissions = s.get("total_emissions_kg")
                    if not emissions:
                        emissions = str(int(dur_minutes * 0.65))
                    
                    carrier_name = first_seg.get("marketing_carrier", {}).get("name") or o.get("owner", {}).get("name")
                    carrier_logo = first_seg.get("marketing_carrier", {}).get("logo_symbol_url") or o.get("owner", {}).get("logo_symbol_url")
                    flight_num = first_seg.get("marketing_carrier_flight_number") or ""
                    
                    segment_details = []
                    for idx, seg in enumerate(segments):
                        seg_dep_time = format_time(seg.get("departing_at"))
                        seg_arr_time = format_time(seg.get("arriving_at"))
                        seg_dur_label = format_duration(seg.get("duration"))
                        
                        seg_carrier_name = seg.get("marketing_carrier", {}).get("name") or o.get("owner", {}).get("name")
                        seg_carrier_logo = seg.get("marketing_carrier", {}).get("logo_symbol_url") or o.get("owner", {}).get("logo_symbol_url")
                        seg_flight_num = seg.get("marketing_carrier_flight_number") or ""
                        seg_flight_num_full = f"{seg.get('marketing_carrier', {}).get('iata_code', '')} {seg_flight_num}".strip()
                        
                        aircraft_info = seg.get("aircraft") or {}
                        aircraft_name = aircraft_info.get("name") if isinstance(aircraft_info, dict) else ""
                        
                        cabin_class = "Economy"
                        checked_baggage = "Baggage details unavailable"
                        carry_on_baggage = "Carry-on details unavailable"
                        wifi = "Wifi details unavailable"
                        power = "Power details unavailable"
                        seat_pitch = "Seat pitch details unavailable"
                        
                        passengers = seg.get("passengers", [])
                        if passengers:
                            first_p = passengers[0]
                            cabin_class = first_p.get("cabin_class_marketing_name") or first_p.get("cabin", {}).get("marketing_name") or "Economy"
                            
                            baggages = first_p.get("baggages", [])
                            checked_count = sum(b.get("quantity", 0) for b in baggages if b.get("type") == "checked")
                            carry_count = sum(b.get("quantity", 0) for b in baggages if b.get("type") == "carry_on")
                            checked_baggage = f"{checked_count} checked bag{'s' if checked_count != 1 else ''} included" if checked_count > 0 else "No checked baggage included"
                            carry_on_baggage = f"{carry_count} carry-on{'s' if carry_count != 1 else ''} included" if carry_count > 0 else "No carry-on included"
                            
                            cabin_info = first_p.get("cabin", {})
                            amenities = cabin_info.get("amenities", {}) if isinstance(cabin_info, dict) else {}
                            wifi_cost = ""
                            seat_type = ""
                            if amenities:
                                wifi_avail = amenities.get("wifi", {}).get("available") if isinstance(amenities.get("wifi"), dict) else False
                                wifi_c = amenities.get("wifi", {}).get("cost") if isinstance(amenities.get("wifi"), dict) else ""
                                wifi_cost = f" ({wifi_c})" if wifi_avail and wifi_c else ""
                                wifi = "Wifi available" if wifi_avail else "No Wifi"
                                
                                power_avail = amenities.get("power", {}).get("available") if isinstance(amenities.get("power"), dict) else False
                                power = "Power outlets available" if power_avail else "No power outlets"
                                
                                seat_info = amenities.get("seat", {}) if isinstance(amenities.get("seat"), dict) else {}
                                pitch = seat_info.get("pitch")
                                seat_pitch = f"{pitch} in pitch" if pitch else "Standard legroom"
                                s_type = seat_info.get("type")
                                seat_type = f" · {s_type}" if s_type else ""
                        
                        layover_info = None
                        if idx < len(segments) - 1:
                            next_seg = segments[idx + 1]
                            try:
                                from datetime import datetime
                                arr_dt = datetime.fromisoformat(seg.get("arriving_at"))
                                dep_dt = datetime.fromisoformat(next_seg.get("departing_at"))
                                diff = dep_dt - arr_dt
                                diff_minutes = int(diff.total_seconds() / 60)
                                h = diff_minutes // 60
                                m = diff_minutes % 60
                                layover_dur = []
                                if h:
                                    layover_dur.append(f"{h} hr")
                                if m:
                                    layover_dur.append(f"{m} min")
                                layover_dur_str = " ".join(layover_dur) if layover_dur else "0 min"
                                layover_airport = seg.get("destination", {}).get("city_name") or seg.get("destination", {}).get("name")
                                layover_code = seg.get("destination", {}).get("iata_code")
                                layover_info = f"{layover_dur_str} layover in {layover_airport} ({layover_code})"
                            except Exception:
                                pass
                        
                        segment_details.append({
                            "flight_number": seg_flight_num_full,
                            "airline": seg_carrier_name,
                            "logo_url": seg_carrier_logo,
                            "origin": seg.get("origin", {}).get("iata_code"),
                            "origin_name": seg.get("origin", {}).get("name") or seg.get("origin", {}).get("city_name"),
                            "destination": seg.get("destination", {}).get("iata_code"),
                            "destination_name": seg.get("destination", {}).get("name") or seg.get("destination", {}).get("city_name"),
                            "departure_time": seg_dep_time,
                            "arrival_time": seg_arr_time,
                            "duration": seg_dur_label,
                            "cabin_class": cabin_class,
                            "aircraft_name": aircraft_name or "Aircraft details not available",
                            "baggage_checked": checked_baggage,
                            "baggage_carry_on": carry_on_baggage,
                            "wifi": f"{wifi}{wifi_cost}",
                            "power": power,
                            "seat_pitch": f"{seat_pitch}{seat_type}",
                            "origin_terminal": seg.get("origin_terminal"),
                            "destination_terminal": seg.get("destination_terminal"),
                            "distance_km": str(int(float(seg.get("distance")))) if seg.get("distance") else None,
                            "layover": layover_info
                        })
                    
                    conditions = s.get("conditions", {})
                    change_penalty = "Change rules unavailable"
                    refund_penalty = "Refund rules unavailable"
                    if conditions:
                        change_info = conditions.get("change_before_departure")
                        if change_info and isinstance(change_info, dict):
                            change_allowed = change_info.get("allowed", False)
                            penalty_amt = change_info.get("penalty_amount")
                            penalty_curr = change_info.get("penalty_currency")
                            if change_allowed:
                                change_penalty = f"Changes allowed ({penalty_amt} {penalty_curr} fee)" if penalty_amt else "Changes allowed (no fee)"
                            else:
                                change_penalty = "Changes not allowed"
                        
                        refund_info = conditions.get("refund_before_departure")
                        if refund_info and isinstance(refund_info, dict):
                            refund_allowed = refund_info.get("allowed", False)
                            penalty_amt = refund_info.get("penalty_amount")
                            penalty_curr = refund_info.get("penalty_currency")
                            if refund_allowed:
                                refund_penalty = f"Refund allowed ({penalty_amt} {penalty_curr} fee)" if penalty_amt else "Refundable"
                            else:
                                refund_penalty = "Non-refundable"
                    
                    offer_slices.append({
                        "origin": s.get("origin", {}).get("iata_code") or first_seg.get("origin", {}).get("iata_code"),
                        "destination": s.get("destination", {}).get("iata_code") or last_seg.get("destination", {}).get("iata_code"),
                        "departure_time": dep_time,
                        "arrival_time": arr_time,
                        "duration": dur_label,
                        "duration_minutes": dur_minutes,
                        "stops_count": stops_count,
                        "stops_text": stops_text,
                        "carbon_emissions": emissions,
                        "airline": carrier_name,
                        "logo_url": carrier_logo,
                        "flight_number": f"{first_seg.get('marketing_carrier', {}).get('iata_code', '')} {flight_num}".strip(),
                        "segments": segment_details,
                        "change_penalty": change_penalty,
                        "refund_penalty": refund_penalty
                    })
                
                import urllib.parse
                airline_name = o.get("owner", {}).get("name", "")
                
                if airline_name:
                    # Uses DuckDuckGo's 'I'm feeling lucky' (!ducky) feature to automatically 
                    # redirect to the first search result (the official airline website)
                    query = urllib.parse.quote(f"!ducky {airline_name} official airline website")
                    redirect_url = f"https://duckduckgo.com/?q={query}"
                else:
                    redirect_url = f"https://www.kayak.com/flights/{origin}-{destination}/{departure_date}?sort=price_a"

                clean_offers.append({
                    "airline": airline_name,
                    "logo_url": o.get("owner", {}).get("logo_symbol_url"),
                    "price": o.get("total_amount"),
                    "currency": o.get("total_currency"),
                    "offer_id": o.get("id"),
                    "redirect_url": redirect_url,
                    "slices": offer_slices
                })

            # Sort by price and limit to top 5 cheapest offers to fit within agent token context limits
            clean_offers.sort(key=lambda x: float(x["price"]) if x.get("price") else 999999.0)
            clean_offers = clean_offers[:5]

            log.info(f"Found {len(clean_offers)} offers")
            return clean_offers

    async def get_offer_details(self, offer_id: str):
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{self.base_url}/air/offers/{offer_id}",
                headers=self.headers,
                timeout=30.0
            )
            r.raise_for_status()
            return r.json()["data"]

    async def get_seat_maps(self, offer_id: str):
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.base_url}/air/seat_maps",
                headers=self.headers,
                json={"data": {"offer_id": offer_id}},
                timeout=30.0
            )
            r.raise_for_status()
            return r.json().get("data", [])

    async def get_order(self, order_id):
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{self.base_url}/air/orders/{order_id}",
                headers=self.headers,
                timeout=30.0
            )
            r.raise_for_status()
            return r.json()["data"]

    async def create_cancellation_quote(self, order_id):
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.base_url}/air/order_cancellations",
                headers=self.headers,
                json={"data": {"order_id": order_id}},
                timeout=30.0
            )
            r.raise_for_status()
            return r.json()["data"]

    async def confirm_cancellation(self, cancellation_quote_id):
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.base_url}/air/order_cancellations/{cancellation_quote_id}/actions/confirm",
                headers=self.headers,
                timeout=30.0
            )
            r.raise_for_status()
            return r.json()["data"]