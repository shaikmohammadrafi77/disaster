import os
import logging
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, flash, redirect, url_for
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "hydration-tracker-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Simple in-memory storage for water intake entries
water_entries = []

class WaterEntry:
    def __init__(self, amount, timestamp=None):
        self.amount = amount
        self.timestamp = timestamp or datetime.now()
    
    def to_dict(self):
        return {
            'amount': self.amount,
            'timestamp': self.timestamp.isoformat(),
            'date': self.timestamp.strftime('%Y-%m-%d'),
            'time': self.timestamp.strftime('%H:%M')
        }

@app.route('/')
def index():
    """Main page displaying the hydration tracker"""
    return render_template('index.html')

@app.route('/log_water', methods=['POST'])
def log_water():
    """Log water intake"""
    try:
        amount = int(request.form.get('amount', 0))
        
        if amount <= 0:
            flash('Please enter a valid amount of water', 'error')
            return redirect(url_for('index'))
        
        # Create and store new water entry
        entry = WaterEntry(amount)
        water_entries.append(entry)
        
        flash(f'Successfully logged {amount}ml of water!', 'success')
        logging.info(f'Water logged: {amount}ml at {entry.timestamp}')
        
    except (ValueError, TypeError):
        flash('Please enter a valid number for water amount', 'error')
    
    return redirect(url_for('index'))

@app.route('/api/entries')
def get_entries():
    """Get water entries for a specific period"""
    period = request.args.get('period', 'today')
    now = datetime.now()
    
    if period == 'today':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'week':
        start_date = now - timedelta(days=7)
    elif period == 'month':
        start_date = now - timedelta(days=30)
    else:
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Filter entries based on period
    filtered_entries = [
        entry.to_dict() for entry in water_entries 
        if entry.timestamp >= start_date
    ]
    
    # Calculate total intake
    total_intake = sum(entry['amount'] for entry in filtered_entries)
    
    # Calculate daily goal progress (recommended 2000ml per day)
    daily_goal = 2000
    if period == 'today':
        goal_progress = min(100, (total_intake / daily_goal) * 100)
    else:
        # For week/month, show average daily intake vs goal
        days = (now - start_date).days + 1
        avg_daily = total_intake / days if days > 0 else 0
        goal_progress = min(100, (avg_daily / daily_goal) * 100)
    
    return jsonify({
        'entries': filtered_entries,
        'total_intake': total_intake,
        'goal_progress': round(goal_progress, 1),
        'period': period
    })

@app.route('/api/delete_entry', methods=['POST'])
def delete_entry():
    """Delete a water entry by index"""
    try:
        index = int(request.json.get('index', -1))
        
        if 0 <= index < len(water_entries):
            deleted_entry = water_entries.pop(index)
            logging.info(f'Deleted entry: {deleted_entry.amount}ml from {deleted_entry.timestamp}')
            return jsonify({'success': True, 'message': 'Entry deleted successfully'})
        else:
            return jsonify({'success': False, 'message': 'Invalid entry index'}), 400
            
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid request'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)