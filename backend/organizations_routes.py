from flask import request, jsonify
from mysql.connector import Error


def register_organization_routes(app, get_connection):

    @app.route("/api/organizations", methods=["GET"])
    def get_organizations():
        conn = None
        cursor = None

        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)

            sql = """
                SELECT 
                    o.organizationName,
                    COUNT(u.userId) AS memberCount
                FROM Organizations o
                LEFT JOIN User u
                    ON u.organizationName = o.organizationName
                GROUP BY o.organizationName
                ORDER BY o.organizationName;
            """

            cursor.execute(sql)
            orgs = cursor.fetchall()
            return jsonify(orgs)

        except Error as e:
            return jsonify({
                "message": "Failed to fetch organizations.",
                "error": str(e)
            }), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()


    @app.route("/api/organizations", methods=["POST"])
    def create_organization():
        """
        Create a new organization.
        Body: { "organizationName": "SomeOrg" }
        """
        data = request.get_json() or {}
        organization_name = data.get("organizationName")

        if not organization_name or not organization_name.strip():
            return jsonify({"message": "organizationName is required"}), 400

        organization_name = organization_name.strip()

        conn = None
        cursor = None

        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute(
                "SELECT organizationName FROM Organizations WHERE organizationName = %s;",
                (organization_name,)
            )
            existing = cursor.fetchone()
            if existing:
                return jsonify({"message": "Organization already exists"}), 400

            cursor.execute(
                "INSERT INTO Organizations (organizationName) VALUES (%s);",
                (organization_name,)
            )
            conn.commit()

            return jsonify({
                "message": "Organization created successfully",
                "organizationName": organization_name
            }), 201

        except Error as e:
            return jsonify({
                "message": "Failed to create organization.",
                "error": str(e)
            }), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    @app.route("/api/organizations/<orgName>", methods=["DELETE"])
    def delete_organization(orgName):
        if not orgName or not orgName.strip():
            return jsonify({"message": "Invalid organization name"}), 400

        orgName = orgName.strip()

        data = request.get_json(silent=True) or {}
        user_id = data.get("userId")

        if not user_id:
            return jsonify({"message": "userId is required"}), 400

        conn = None
        cursor = None

        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT userId, role FROM User WHERE userId = %s;",
                (user_id,)
            )
            user_row = cursor.fetchone()
            if not user_row:
                return jsonify({"message": "Requesting user not found"}), 404

            is_admin = (user_row.get("role") == "admin")

            cursor.execute(
                "SELECT organizationName FROM Organizations WHERE organizationName = %s;",
                (orgName,)
            )
            existing = cursor.fetchone()
            if not existing:
                return jsonify({"message": "Organization not found"}), 404

            cursor.execute(
                "SELECT COUNT(*) AS cnt FROM User WHERE organizationName = %s;",
                (orgName,)
            )
            user_ref = cursor.fetchone()["cnt"]

            cursor.execute(
                "SELECT COUNT(*) AS cnt FROM Events WHERE organizationName = %s;",
                (orgName,)
            )
            event_ref = cursor.fetchone()["cnt"]

            if not is_admin:
                if user_ref > 0 or event_ref > 0:
                    return jsonify({
                        "message": "Cannot delete organization that is still referenced "
                                   "by users or events.",
                        "userCount": user_ref,
                        "eventCount": event_ref
                    }), 400

                cursor.execute(
                    "DELETE FROM Organizations WHERE organizationName = %s;",
                    (orgName,)
                )
                conn.commit()

                return jsonify({
                    "message": "Organization deleted successfully",
                    "organizationName": orgName,
                    "userCount": user_ref,
                    "eventCount": event_ref
                })

            if event_ref > 0:
                return jsonify({
                    "message": ("Organization still has events associated with it. "
                                "Please delete or reassign those events first."),
                    "userCount": user_ref,
                    "eventCount": event_ref
                }), 400
            default_org = "default"
            cursor.execute(
                "UPDATE User SET organizationName = %s WHERE organizationName = %s;",
                (default_org, orgName)
            )

            cursor.execute(
                "DELETE FROM Organizations WHERE organizationName = %s;",
                (orgName,)
            )

            conn.commit()

            return jsonify({
                "message": "Organization deleted by admin. All members were removed from this organization.",
                "organizationName": orgName,
                "kickedMembers": user_ref,
                "eventCount": event_ref
            })

        except Error as e:
            return jsonify({
                "message": "Failed to delete organization.",
                "error": str(e)
            }), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()


    @app.route("/api/user/<userId>/organization", methods=["GET"])
    def get_user_organization(userId):
        """
        Get the organization for a specific user.

        Returns: { "userId": ..., "organizationName": "..." } or 404
        """
        conn = None
        cursor = None

        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute(
                "SELECT userId, organizationName FROM User WHERE userId = %s;",
                (userId,)
            )
            user = cursor.fetchone()
            if not user:
                return jsonify({"message": "User not found"}), 404

            return jsonify(user)

        except Error as e:
            return jsonify({
                "message": "Failed to fetch user's organization.",
                "error": str(e)
            }), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    @app.route("/api/user/<userId>/organization", methods=["PUT"])
    def update_user_organization(userId):
        data = request.get_json() or {}
        raw_org = data.get("organizationName", None)

        if raw_org is None or (isinstance(raw_org, str) and not raw_org.strip()):
            new_org = "default"  
            leaving = True
        else:
            new_org = raw_org.strip()
            leaving = (new_org == "default")

        conn = None
        cursor = None

        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute(
                "SELECT userId FROM User WHERE userId = %s;",
                (userId,)
            )
            user = cursor.fetchone()
            if not user:
                return jsonify({"message": "User not found"}), 404

            if new_org != "default":
                cursor.execute(
                    "SELECT organizationName FROM Organizations WHERE organizationName = %s;",
                    (new_org,)
                )
                org = cursor.fetchone()
                if not org:
                    return jsonify({
                        "message": "Target organization does not exist"
                    }), 400

            cursor.execute(
                "UPDATE User SET organizationName = %s WHERE userId = %s;",
                (new_org, userId)
            )
            conn.commit()

            return jsonify({
                "message": "User left organization" if leaving else "User organization updated successfully",
                "userId": userId,
                "organizationName": new_org
            })

        except Error as e:
            return jsonify({
                "message": "Failed to update user's organization.",
                "error": str(e)
            }), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
