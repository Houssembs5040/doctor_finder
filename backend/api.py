from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# MySQL configuration (update with your credentials)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:root@localhost/doctors_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-secret-key-here'  # Change this to a secure random key in production

db = SQLAlchemy(app)

# Models
class Doctor(db.Model):
    __tablename__ = 'doctors'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    specialty = db.Column(db.String(50), nullable=False)
    city = db.Column(db.String(50), nullable=False)
    image = db.Column(db.String(200))
    gender = db.Column(db.Enum('Male', 'Female'))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'specialty': self.specialty,
            'city': self.city,
            'image': self.image or '',
            'gender': self.gender
        }

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email
        }

class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum('Pending', 'Confirmed', 'Completed', 'Cancelled'), default='Pending')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'doctor_id': self.doctor_id,
            'appointment_date': self.appointment_date.isoformat(),
            'status': self.status
        }

class Favorite(db.Model):
    __tablename__ = 'favorites'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'doctor_id': self.doctor_id
        }

with app.app_context():
    db.create_all()
    user = User.query.filter_by(email='john.doe@example.com').first()
    if user and not user.password.startswith('$2b$'):
        user.password = bcrypt.generate_password_hash('password123').decode('utf-8')
        db.session.commit()
    elif not user:
        sample_user = User(
            first_name='John',
            last_name='Doe',
            email='john.doe@example.com',
            password=bcrypt.generate_password_hash('password123').decode('utf-8')
        )
        db.session.add(sample_user)
        db.session.commit()

@app.route('/api/doctors', methods=['GET'])  # Public endpoint
def get_doctors():
    doctors = Doctor.query.all()
    return jsonify([doctor.to_dict() for doctor in doctors])

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password, password):
        access_token = create_access_token(identity=user.id)
        return jsonify({'message': 'Login successful', 'user': user.to_dict(), 'access_token': access_token}), 200
    return jsonify({'message': 'Invalid email or password'}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    password = data.get('password')
    if not all([first_name, last_name, email, password]):
        return jsonify({'message': 'All fields are required'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered'}), 409
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(first_name=first_name, last_name=last_name, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    access_token = create_access_token(identity=new_user.id)
    return jsonify({'message': 'Registration successful', 'user': new_user.to_dict(), 'access_token': access_token}), 201

@app.route('/api/appointments', methods=['POST'])
@jwt_required()
def get_appointments():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or user_id != current_user_id:
        return jsonify({'message': 'Unauthorized or invalid user ID'}), 403
    appointments = Appointment.query.filter_by(user_id=user_id).all()
    return jsonify([appointment.to_dict() for appointment in appointments])

@app.route('/api/favorites', methods=['POST'])
@jwt_required()
def get_favorites():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or user_id != current_user_id:
        return jsonify({'message': 'Unauthorized or invalid user ID'}), 403
    favorites = Favorite.query.filter_by(user_id=user_id).all()
    result = []
    print(result)
    for favorite in favorites:
        doctor = Doctor.query.get(favorite.doctor_id)
        if doctor:
            result.append(doctor.to_dict())
    return jsonify(result)

@app.route('/api/profile', methods=['POST'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id or user_id != current_user_id:
        return jsonify({'message': 'Unauthorized or invalid user ID'}), 403
    user = User.query.get(user_id)
    if user:
        return jsonify(user.to_dict())
    return jsonify({'message': 'User not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)