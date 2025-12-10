import random
from flask import Blueprint, request, jsonify
from mysql.connector import Error

events_bp = Blueprint('events', __name__)

get_connection = None

def init_events(connection_func):
    """Initialize the events module with the database connection function"""
    global get_connection
    get_connection = connection_func


@events_bp.route("/api/events", methods=["GET"])
def get_all_events():
    """Get all events with participant count calculated from Reports table"""
    sql = """
        SELECT 
            e.eventId,
            e.eventName,
            e.description,
            e.location,
            e.time,
            e.organizationName,
            COUNT(DISTINCT r.userId) AS participantCount,
            o.organizationName AS hostOrganization
        FROM Events e
        LEFT JOIN Reports r 
            ON e.eventId = r.eventId
        LEFT JOIN Organizations o 
            ON e.organizationName = o.organizationName
        GROUP BY e.eventId, e.eventName, e.description, e.location, e.time, e.organizationName, o.organizationName
        ORDER BY e.time DESC;
    """
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql)
        events = cursor.fetchall()
        return jsonify(events)
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

@events_bp.route("/api/events/user/<userId>", methods=["GET"])
def get_user_events(userId):
    sql = """
        SELECT DISTINCT e.* FROM Events e
        INNER JOIN Reports r ON e.eventId = r.eventId
        WHERE r.userId = %s
    """
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql, (userId,))
        events = cursor.fetchall()
        return jsonify(events)
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

@events_bp.route("/api/events", methods=["POST"])                 # Create: { eventName, description, location, time, participantCount, organizationName }
def create_event():
    data = request.get_json()
    sql = """
        INSERT INTO Events (eventId, eventName, description, location, time, participantCount, organizationName)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        # Generate a unique eventId
        event_id = random.randint(100000, 999999)
        cursor.execute(sql, (
            event_id,
            data['eventName'],
            data['description'],
            data['location'],
            data['time'],
            data['participantCount'],
            data['organizationName']
        ))
        conn.commit()
        return jsonify({"message": "Event created successfully.", "eventId": event_id}), 201
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

@events_bp.route("/api/events/<eventId>/join", methods=["POST"])  # Join event (create Report)
def join_event(eventId):
    data = request.get_json()
    sql = """
        INSERT INTO Reports (sightingId, userId, eventId, status, notes, time)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    update_sql = "UPDATE Events SET participantCount = participantCount + 1 WHERE eventId = %s"
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(sql, (
            data.get('sightingId'),
            data['userId'],
            eventId,
            data.get('status', 'joined'),
            data.get('notes', ''),
            data.get('time')
        ))
        cursor.execute(update_sql, (eventId,))
        conn.commit()
        return jsonify({"message": "Successfully joined event.", "reportId": cursor.lastrowid}), 201
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

@events_bp.route("/api/events/<eventId>/leave", methods=["POST"]) # Leave event (delete Report)
def leave_event(eventId):
    data = request.get_json()
    sql = "DELETE FROM Reports WHERE eventId = %s AND userId = %s"
    update_sql = "UPDATE Events SET participantCount = participantCount - 1 WHERE eventId = %s"
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(sql, (eventId, data['userId']))
        cursor.execute(update_sql, (eventId,))
        conn.commit()
        return jsonify({"message": "Successfully left event."})
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

@events_bp.route("/api/events/<eventId>", methods=["DELETE"])     # Delete event
def delete_event(eventId):
    sql = "DELETE FROM Events WHERE eventId = %s"
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(sql, (eventId,))
        conn.commit()
        return jsonify({"message": "Event deleted successfully."})
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