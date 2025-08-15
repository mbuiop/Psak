import os
from flask import Flask, render_template, redirect, url_for, flash, request, abort
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from models import db, User, Product, Broadcast
from config import Config
from forms import RegistrationForm, LoginForm, ProductForm, BroadcastForm

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
migrate = Migrate(app, db)

login_manager = LoginManager(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Routes
@app.route('/')
def home():
    products = Product.query.all()
    broadcasts = Broadcast.query.order_by(Broadcast.created_at.desc()).limit(3).all()
    return render_template('index.html', products=products, broadcasts=broadcasts)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        hashed_password = generate_password_hash(form.password.data)
        user = User(
            username=form.username.data,
            email=form.email.data,
            password=hashed_password
        )
        db.session.add(user)
        db.session.commit()
        flash('حساب کاربری شما با موفقیت ایجاد شد! لطفاً وارد شوید.', 'success')
        return redirect(url_for('login'))
    
    return render_template('auth/register.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and check_password_hash(user.password, form.password.data):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('home'))
        else:
            flash('ورود ناموفق! لطفاً ایمیل و رمز عبور را بررسی کنید.', 'danger')
    
    return render_template('auth/login.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/profile')
@login_required
def profile():
    return render_template('user/profile.html')

# Admin Routes
@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        abort(403)
    return render_template('admin/dashboard.html')

@app.route('/admin/products')
@login_required
def admin_products():
    if not current_user.is_admin:
        abort(403)
    products = Product.query.all()
    return render_template('admin/products.html', products=products)

@app.route('/admin/add_product', methods=['GET', 'POST'])
@login_required
def add_product():
    if not current_user.is_admin:
        abort(403)
    
    form = ProductForm()
    if form.validate_on_submit():
        # Handle file upload
        image = form.image.data
        if image and allowed_file(image.filename):
            filename = secure_filename(image.filename)
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image.save(image_path)
        else:
            filename = 'default.jpg'
        
        product = Product(
            name=form.name.data,
            description=form.description.data,
            price=form.price.data,
            image=filename,
            category=form.category.data
        )
        db.session.add(product)
        db.session.commit()
        flash('محصول با موفقیت اضافه شد!', 'success')
        return redirect(url_for('admin_products'))
    
    return render_template('admin/add_product.html', form=form)

@app.route('/admin/broadcast', methods=['GET', 'POST'])
@login_required
def broadcast_message():
    if not current_user.is_admin:
        abort(403)
    
    form = BroadcastForm()
    if form.validate_on_submit():
        broadcast = Broadcast(message=form.message.data)
        db.session.add(broadcast)
        db.session.commit()
        flash('پیام همگانی با موفقیت ارسال شد!', 'success')
        return redirect(url_for('admin_dashboard'))
    
    return render_template('admin/broadcast.html', form=form)

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True)
