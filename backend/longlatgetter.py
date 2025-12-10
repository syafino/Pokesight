import googlemaps
import os

# Load API key from environment variable
gmaps = googlemaps.Client(key=os.environ.get("GOOGLE_MAPS_API_KEY", ""))

def geocode_city(city):
    geocode_result = gmaps.geocode(city)
    if geocode_result:
        location = geocode_result[0]['geometry']['location']
        return location['lat'], location['lng']
    else:
        return None, None



