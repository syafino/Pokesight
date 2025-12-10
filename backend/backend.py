# server.py (Flask version)

import os
from dotenv import load_dotenv
from pprint import pprint
from organizations_routes import register_organization_routes

# after app + db_config + get_connection are defined:


# Load environment variables from .env file FIRST
load_dotenv()

from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from longlatgetter import geocode_city
import hashlib

app = Flask(
    __name__,
    template_folder='views',  
    static_folder='public'    
)

# Enable CORS for frontend to make requests
CORS(app)

db_config = {
    'host': '-',
    'user':'-',
    'password': '-', #CHANGE THIS PASSWORD
    'database': '-',
    'ssl_disabled': False,  # Enable SSL
    'ssl_verify_cert': False  # Don't verify server certificate (Cloud SQL handles this)
}


def get_connection():
    """Create a new DB connection."""
    return mysql.connector.connect(**db_config)

register_organization_routes(app, get_connection)

from sightings import sightings_bp, init_sightings
init_sightings(get_connection)
app.register_blueprint(sightings_bp)

from events import events_bp, init_events
init_events(get_connection)
app.register_blueprint(events_bp)

@app.route("/api/test", methods=["GET"])
def test_connection():
    """Test endpoint to verify database connection"""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) as count FROM Pokemon")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return jsonify({
            "status": "success",
            "message": "Database connected",
            "pokemon_count": result['count']
        })
    except Error as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

import hashlib
def get_hashed_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    hashed_password = get_hashed_password(password)

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400
    
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        #user table has #userId, password, role, organizationName
        #Check if it already exists
        cursor.execute("SELECT * FROM User WHERE userId = %s", (username,))
        existing_user = cursor.fetchone()
        if existing_user:
            return jsonify({"message": "Username already exists"}), 400
        role = "user"
        organizationName = "default"
        cursor.execute("INSERT INTO User (userId, password, role, organizationName) VALUES (%s, %s, %s, %s)", (username, hashed_password, role, organizationName))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Registration successful"})
    except Error as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/api/get_pokemon_sightings", methods=["POST"])
def get_pokemon_sightings():
    data = request.get_json()
    name = data.get("name")
    city = data.get("city")
    range_miles = data.get("range", 5)
    weather = data.get("weather")
    minCP = data.get("minCP")
    maxCP = data.get("maxCP")

    if not name or not city:
        return jsonify({"message": "Pokémon name and city are required"}), 400

    lat, lng = geocode_city(city)
    if lat is None or lng is None:
        return jsonify({"message": "City not found"}), 400

    base_where = """
        (ST_Distance_Sphere(
            POINT(%s, %s),
            POINT(s.longitude, s.latitude)
        ) / 1609.34) <= %s
    """
    params = [lng, lat, range_miles]

    filters = []

    if weather:
        filters.append("s.weather = %s")
        params.append(weather)

    if minCP:
        filters.append("scp.max_cp >= %s")
        params.append(minCP)

    if maxCP:
        filters.append("scp.max_cp <= %s")
        params.append(maxCP)

    where_clause = base_where
    if filters:
        where_clause += " AND " + " AND ".join(filters)

    sql = f"""
        SELECT s.sightingId as id, s.latitude, s.longitude, s.weather, s.appearedTimeOfDay
        FROM Pokemon p
        NATURAL JOIN StatsCP scp 
        JOIN Sighting s ON p.pokemon_id = s.pokemon_id
        WHERE p.pokemon_name = %s AND {where_clause}
    """
    params = [name] + params  # name goes first

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql, params)
        sightings = cursor.fetchall()
        return jsonify(sightings)
    except Error as e:
        return jsonify({"message": "Database query failed", "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/api/get_pokemon_details", methods=["POST"])
def get_pokemon_details():
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"message": "Pokémon name is required"}), 400

    pokemon_name = data["name"]
    
    print("Connecting to database...")
    conn = get_connection()
    print("Connected! Creating cursor...")
    cursor = conn.cursor(dictionary=True)
    try:
        sql = """
            SELECT *
            FROM Pokemon p NATURAL JOIN StatsCP scp
            WHERE p.pokemon_name = %s
            LIMIT 1
        """
        cursor.execute(sql, (pokemon_name,))
        print("Query executed! Fetching results...")
        pokemon = cursor.fetchone()

        if not pokemon:
            return jsonify({"message": f"No Pokémon found with name {pokemon_name}"}), 404

        # Optionally format the response
        response = {
            "name": pokemon["pokemon_name"],
            "type": pokemon.get("type", "").split(",") if pokemon.get("type") else [],
            "rarity": pokemon.get("rarity", ""),
            "baseAttack": pokemon.get("base_attack", 0),
            "baseDefense": pokemon.get("base_defense", 0),
            "baseStamina": pokemon.get("base_stamina", 0),
            "maxCP": pokemon.get("max_cp", 0)
        }

        return jsonify(response)
    finally:
        cursor.close()


@app.route("/api/get_pokemon", methods=["POST"])
def get_attendance():
    data = request.get_json()
    range = data.get("range")
    city_name = data.get("city")
    pokemon_type = data.get("type")
    pokemon_rarity = data.get("rarity")
    weather = data.get("weather")
    minCP = data.get("minCP")
    maxCP = data.get("maxCP")

    print(f"Received request: city={city_name}, range={range}, type={pokemon_type}, rarity={pokemon_rarity}, weather={weather}, minCP={minCP}, maxCP={maxCP}")
    
    lat, lng = geocode_city(city_name)
    
    print(f"Geocoded: lat={lat}, lng={lng}")

    if not lat or not lng:
        return jsonify({
            "message": "City not found",
            "city": city_name
        }), 400

    base_where = """
    (
        ST_Distance_Sphere(
            POINT(%s, %s),
            POINT(s.longitude, s.latitude)
        ) / 1609.34
    ) <= %s
    """

    params = [lng, lat, range]

    filters = []

    # Optional filters
    if pokemon_type:
        filters.append("p.type = %s")
        params.append(pokemon_type)

    if pokemon_rarity:
        filters.append("p.rarity = %s")
        params.append(pokemon_rarity)

    if weather:
        filters.append("s.weather = %s")
        params.append(weather)

    if minCP:
        filters.append("scp.max_cp >= %s")
        params.append(minCP)

    if maxCP:
        filters.append("scp.max_cp <= %s")
        params.append(maxCP)

    where_clause = base_where
    if filters:
        where_clause += " AND " + " AND ".join(filters)

    if not (minCP or maxCP):
        sql = f"""
                SELECT DISTINCT p.pokemon_name
                FROM Pokemon p 
                JOIN Sighting s ON p.pokemon_id = s.pokemon_id
                WHERE {where_clause}
                ORDER BY p.pokemon_name;
                """
    else:
        sql = f"""
                SELECT DISTINCT p.pokemon_name
                FROM Pokemon p
                NATURAL JOIN StatsCP scp 
                JOIN Sighting s ON p.pokemon_id = s.pokemon_id
                WHERE {where_clause}
                ORDER BY p.pokemon_name;
                """

    print("sql: ", sql)
    print("filters: ", filters)
    print("params: ", params)

    conn = None
    cursor = None
    try:
        print("Connecting to database...")
        conn = get_connection()
        print("Connected! Creating cursor...")
        cursor = conn.cursor(dictionary=True)
        print(f"Executing query with params: lng={lng}, lat={lat}, range={range}, type={pokemon_type}, rarity={pokemon_rarity}, weather={weather}, minCP={minCP}, maxCP={maxCP}")
        cursor.execute(sql, params)
        print("Query executed! Fetching results...")
        results = cursor.fetchall()
        print(f"Found {len(results)} Pokemon")
        print(f"Results: {results}")
    except Error as e:
        print("Error fetching pokemon data:", e)
        import traceback
        traceback.print_exc()
        return jsonify({
            "message": "Database connection failed. Check if your MySQL server is running and accessible.",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

    return jsonify(results)


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    hashed_password = get_hashed_password(password)

    sql = "SELECT * FROM User WHERE userId = %s AND password = %s"

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql, (username, hashed_password))
        user = cursor.fetchone()
        
        if user:
            return jsonify({
                "message": "Login successful",
                "user": user
            })
        else:
            return jsonify({
                "message": "Invalid username or password. Please try again."
            }), 401
    except Error as e:
        return jsonify({
            "message": "Database connection failed. Check if your MySQL server is running and accessible.",
            "error": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)


