import os
import requests
from flask import Blueprint, request, jsonify
from mysql.connector import Error

sightings_bp = Blueprint('sightings', __name__)

get_connection = None

#for connection with backend.py
def init_sightings(connection_func):
    global get_connection
    get_connection = connection_func


# Weather code to condition mapping for Open-Meteo API
WEATHER_CODE_MAP = {
    0: 'Clear', 1: 'Clear', 2: 'Clouds', 3: 'Clouds',
    45: 'Fog', 48: 'Fog',
    51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
    61: 'Rain', 63: 'Rain', 65: 'Rain',
    71: 'Snow', 73: 'Snow', 75: 'Snow',
    80: 'Rain', 81: 'Rain', 82: 'Rain',
    95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
}

#weather data fetching
def fetch_weather_data(latitude, longitude):
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            current = data.get('current', {})
            weather_code = current.get('weather_code', 0)
            weather = WEATHER_CODE_MAP.get(weather_code, 'Clear')
            
            temperature = current.get('temperature_2m', 70.0)
            
            wind_speed = current.get('wind_speed_10m', 5.0)
            
            return {
                'weather': weather,
                'temperature': round(temperature, 1),
                'windSpeed': round(wind_speed, 1)
            }
    except Exception as e:
        print(f"Weather API error: {e}")
    
    return None

#time of day based on current hour/time
def get_time_of_day():
    from datetime import datetime
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return 'morning'
    elif 12 <= hour < 17:
        return 'afternoon'
    elif 17 <= hour < 21:
        return 'evening'
    else:
        return 'night'


#sighting endpoint checked with reports table

@sightings_bp.route("/api/sightings/user/<userId>", methods=["GET"])
def get_user_sightings(userId):
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT s.*, p.pokemon_name as pokemonName, l.city as location, r.reportId, r.status, r.notes, r.time as reportTime
            FROM Reports r
            JOIN Sighting s ON r.sightingId = s.sightingId
            JOIN Pokemon p ON s.pokemon_id = p.pokemon_id
            LEFT JOIN Location l ON s.longitude = l.longitude AND s.latitude = l.latitude
            WHERE r.userId = %s
            ORDER BY r.time DESC
        """, (userId,))
        sightings = cursor.fetchall()
        return jsonify(sightings)
    except Error as e:
        print(f"Error fetching user sightings: {e}")
        return jsonify({"message": "Failed to fetch user sightings", "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

#create sighting with a stored procedure CreateSightingWithReport
@sightings_bp.route("/api/sightings", methods=["POST"])
def create_sighting():
    data = request.get_json()
    pokemon_id = data.get("pokemonId")
    user_id = data.get("userId")
    longitude = data.get("longitude")
    latitude = data.get("latitude")
    notes = data.get("notes", "")

    if not pokemon_id or not user_id or longitude is None or latitude is None:
        return jsonify({"message": "pokemonId, userId, longitude, and latitude are required"}), 400

    weather_data = fetch_weather_data(latitude, longitude)
    
    if weather_data:
        weather = weather_data['weather']
        temperature = weather_data['temperature']
        wind_speed = weather_data['windSpeed']
    else:
        weather = data.get("weather", "Clear")
        temperature = data.get("temperature", 70.0)
        wind_speed = data.get("windSpeed", 5.0)
    
    appeared_time = get_time_of_day()

    import uuid
    sighting_id = str(uuid.uuid4())

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Call the stored procedure with transaction
        args = (sighting_id, pokemon_id, longitude, latitude, appeared_time, 
                weather, temperature, wind_speed, user_id, notes, 0)
        result = cursor.callproc('CreateSightingWithReport', args)
        report_id = result[-1]

        return jsonify({
            "message": "Sighting created successfully",
            "sightingId": sighting_id,
            "reportId": report_id
        })
    except Error as e:
        print(f"Database error creating sighting: {e}")  #debug
        return jsonify({"message": "Failed to create sighting", "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

#deleting sighting using transaction DeleteSightingWithCleanup
@sightings_bp.route("/api/sightings/<sightingId>", methods=["DELETE"])
def delete_sighting(sightingId):
    data = request.get_json()
    user_id = data.get("userId")

    if not user_id:
        return jsonify({"message": "userId is required"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Call the stored procedure with transaction
        args = (sightingId, user_id, False, '')
        result = cursor.callproc('DeleteSightingWithCleanup', args)
        success = result[2]  # p_success OUT parameter
        message = result[3]  # p_message OUT parameter

        if success:
            return jsonify({"message": message})
        else:
            return jsonify({"message": message}), 403
    except Error as e:
        return jsonify({"message": "Failed to delete sighting", "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
