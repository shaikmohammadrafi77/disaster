# Hydration Tracker

## Overview

A simple web application for tracking daily water intake built with Flask and Bootstrap. The application allows users to log water consumption throughout the day, view their hydration progress, and maintain a record of their drinking habits. The app features a clean, responsive interface with progress visualization and quick-entry buttons for common water amounts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Template Engine**: Jinja2 templates with Flask for server-side rendering
- **UI Framework**: Bootstrap 5.3.0 for responsive design and components
- **Icons**: Feather Icons for consistent iconography
- **Styling**: Custom CSS with CSS variables for theme management and modern design patterns
- **JavaScript**: Vanilla JavaScript for client-side interactivity including period switching, form validation, and dynamic UI updates

### Backend Architecture
- **Web Framework**: Flask with minimal configuration for simplicity
- **Application Structure**: Single-file Flask application (`app.py`) with main entry point (`main.py`)
- **Data Models**: Simple Python classes (`WaterEntry`) for representing water intake records
- **Storage**: In-memory storage using Python lists (temporary solution)
- **Session Management**: Flask sessions with configurable secret key from environment variables

### Data Storage
- **Current Implementation**: In-memory storage using Python lists
- **Data Structure**: `WaterEntry` objects containing amount and timestamp information
- **Persistence**: No database persistence currently implemented (data lost on restart)

### Security & Configuration
- **Environment Variables**: Session secret key configurable via environment
- **Proxy Support**: ProxyFix middleware for deployment behind reverse proxies
- **Logging**: Basic Python logging configured for debugging

## External Dependencies

### Frontend Dependencies
- **Bootstrap 5.3.0**: CSS framework loaded via CDN for responsive UI components
- **Feather Icons**: Icon library loaded via CDN for consistent iconography

### Backend Dependencies
- **Flask**: Core web framework for routing, templating, and request handling
- **Werkzeug**: WSGI utilities including ProxyFix middleware for deployment scenarios

### Development Tools
- **Python Logging**: Built-in logging module for application debugging
- **Flask Development Server**: Built-in development server with debug mode support

Note: The current implementation uses in-memory storage which is suitable for development but will require database integration for production use.