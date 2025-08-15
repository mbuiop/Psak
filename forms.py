from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, TextAreaField, FloatField, FileField, SelectField
from wtforms.validators import DataRequired, Email, EqualTo, Length

class RegistrationForm(FlaskForm):
    username = StringField('نام کاربری', validators=[DataRequired(), Length(min=2, max=50)])
    email = StringField('ایمیل', validators=[DataRequired(), Email()])
    password = PasswordField('رمز عبور', validators=[DataRequired()])
    confirm_password = PasswordField('تکرار رمز عبور', validators=[
        DataRequired(), 
        EqualTo('password', message='رمزهای عبور باید مطابقت داشته باشند')
    ])
    submit = SubmitField('ثبت نام')

class LoginForm(FlaskForm):
    email = StringField('ایمیل', validators=[DataRequired(), Email()])
    password = PasswordField('رمز عبور', validators=[DataRequired()])
    submit = SubmitField('ورود')

class ProductForm(FlaskForm):
    name = StringField('نام محصول', validators=[DataRequired()])
    description = TextAreaField('توضیحات', validators=[DataRequired()])
    price = FloatField('قیمت', validators=[DataRequired()])
    category = SelectField('دسته‌بندی', choices=[
        ('men', 'مردانه'),
        ('women', 'زنانه'),
        ('kids', 'بچه‌گانه'),
        ('accessories', 'اکسسوری')
    ], validators=[DataRequired()])
    image = FileField('تصویر محصول')
    submit = SubmitField('ذخیره')

class BroadcastForm(FlaskForm):
    message = TextAreaField('پیام همگانی', validators=[DataRequired()])
    submit = SubmitField('ارسال پیام')
