# Bookstore API

A RESTful API for a bookstore application featuring user authentication, book management, order processing, reviews, and Google OAuth integration.

## Features

- User registration, login, logout, profile, and account deletion
- Google OAuth login
- Book CRUD operations (admin only)
- Order creation and management with stock validation
- Review creation, update, and deletion
- Role-based access control (admin, user, deliver)
- Email notifications (order confirmation)
- Email & notification sending via background jobs with BullMQ & Redis queue
- Background job processing with Redis queue
- Monitoring with Prometheus and Grafana

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
MONGO_URI=mongodb://localhost:27017/auth-app?replicaSet=rs0

JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password

