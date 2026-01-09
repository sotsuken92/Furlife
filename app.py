from flask import send_from_directory
from flask import Flask, request, redirect, url_for, jsonify, render_template, session
import json
import re
from datetime import datetime
import pytz
import os
import calendar
import random
import requests
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
from urllib.parse import quote_plus

# 日本時間のタイムゾーン設定
JST = pytz.timezone('Asia/Tokyo')

# =============================================================================
# アプリケーション初期化する
# =============================================================================

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "your-secret-key-here-change-this")

# MongoDB接続設定
MONGODB_URI = os.environ.get("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI環境変数が設定されていません")

# MongoDBクライアントの初期化
client = MongoClient(MONGODB_URI)
db = client.furlife_db  # データベース名

# コレクション定義
events_collection = db.events
pokedex_collection = db.pokedex
users_collection = db.users
goals_collection = db.goals
locations_collection = db.locations
pets_collection = db.pets

# APIå®šç¾©
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "YOUR_API_KEY_HERE")

# =============================================================================
# データ取得・保存関数（MongoDB版）
# =============================================================================

def get_user_events():
    """現在のユーザーのイベントデータを取得"""
    username = session.get("username")
    if not username:
        return {}
    
    doc = events_collection.find_one({"username": username})
    return doc["events"] if doc else {}

def save_user_events(events_data):
    """ユーザーのイベントデータを保存"""
    username = session.get("username")
    if not username:
        return
    
    events_collection.update_one(
        {"username": username},
        {"$set": {"events": events_data}},
        upsert=True
    )

def get_user_pokedex():
    """現在のユーザーの図鑑データを取得（常に最新）"""
    username = session.get("username")
    if not username:
        return {"discovered": [], "育成_counts": {}}
    
    # ★重要: データベースから直接取得（キャッシュなし）
    doc = pokedex_collection.find_one({"username": username})
    if not doc:
        return {"discovered": [], "育成_counts": {}}
    
    # 育成_countsフィールドがない場合は初期化
    if "育成_counts" not in doc:
        doc["育成_counts"] = {}
    
    return {"discovered": doc.get("discovered", []), "育成_counts": doc.get("育成_counts", {})}

def save_user_pokedex(pokedex_data):
    """ユーザーの図鑑データを保存（確実に保存）"""
    username = session.get("username")
    if not username:
        return
    
    # ★重要: write_concernを使って確実に書き込み完了を待つ
    pokedex_collection.update_one(
        {"username": username},
        {"$set": pokedex_data},
        upsert=True
    )

def get_user_goals():
    """現在のユーザーの目標データを取得"""
    username = session.get("username")
    if not username:
        return {}
    
    doc = goals_collection.find_one({"username": username})
    return doc["goals"] if doc else {}

def save_user_goals(goals_data):
    """ユーザーの目標データを保存"""
    username = session.get("username")
    if not username:
        return
    
    goals_collection.update_one(
        {"username": username},
        {"$set": {"goals": goals_data}},
        upsert=True
    )

def get_user_locations():
    """現在のユーザーの場所設定を取得"""
    username = session.get("username")
    default_locations = {
        "自宅": "#ef4444",
        "屋外": "#10b981",
        "外(屋内)": "#f59e0b",
        "オンライン": "#8b5cf6",
        "その他": "#64748b"
    }
    
    if not username:
        return default_locations
    
    doc = locations_collection.find_one({"username": username})
    return doc["locations"] if doc else default_locations

def save_user_locations(locations_data):
    """ユーザーの場所データを保存"""
    username = session.get("username")
    if not username:
        return
    
    locations_collection.update_one(
        {"username": username},
        {"$set": {"locations": locations_data}},
        upsert=True
    )

def get_user_pet():
    """現在のユーザーのペットデータを取得"""
    username = session.get("username")
    default_pet = {
        "level": 0, "food": 0, "exp": 0, "coins": 0,
        "message": "ログインしてペットを育てよう!" if username else "ログインしてペットを育てよう!",
        "alive": False, "started": False, "pet_type": None, "evolution": 1,
        "inventory": {
            '基本の餌': 0,
            'おいしい餌': 0,
            'プレミアム餌': 0,
            'スペシャル餌': 0,
        }
    }
    
    if not username:
        return default_pet
    
    doc = pets_collection.find_one({"username": username})
    if not doc:
        return default_pet
    
    # 既存データに不足しているフィールドを追加
    if "coins" not in doc:
        doc["coins"] = 0
    if "inventory" not in doc:
        doc["inventory"] = {
            '基本の餌': 0,
            'おいしい餌': 0,
            'プレミアム餌': 0,
            'スペシャル餌': 0,
        }
    if "exp" not in doc:
        doc["exp"] = 0
    
    return doc

def save_user_pet(pet_data):
    """ユーザーのペットデータを保存"""
    username = session.get("username")
    if not username:
        return
    
    pet_data["username"] = username
    pets_collection.update_one(
        {"username": username},
        {"$set": pet_data},
        upsert=True
    )

def add_to_pokedex(image_name):
    """図鑑に新しいペットを追加（重複チェック強化）"""
    username = session.get("username")
    if not username:
        return
    
    # eggは図鑑に追加しない
    if image_name.startswith("egg"):
        return
    
    # ★重要: 最新のデータを取得
    user_pokedex = get_user_pokedex()
    
    # 既に発見済みの場合はスキップ
    if image_name in user_pokedex["discovered"]:
        return
    
    # 新規発見として追加
    user_pokedex["discovered"].append(image_name)
    
    # ★重要: すぐに保存
    save_user_pokedex(user_pokedex)

def increment_育成_count(image_name):
    """ペットの育成回数をカウント（原子的に更新）"""
    username = session.get("username")
    if not username or image_name.startswith("egg"):
        return
    
    # ★デバッグ用ログ追加
    print(f"[DEBUG] Incrementing 育成_count for {username}: {image_name}")
    
    # ★重要: まず現在のデータを取得
    user_pokedex = get_user_pokedex()
    
    # 育成回数をインクリメント
    current_count = user_pokedex["育成_counts"].get(image_name, 0)
    user_pokedex["育成_counts"][image_name] = current_count + 1
    
    # ★重要: データベースに保存
    save_user_pokedex(user_pokedex)
    
    # ★デバッグ用ログ追加
    print(f"[DEBUG] Updated 育成_count for {image_name}: {current_count} -> {current_count + 1}")

# =============================================================================
# ユーティリティ関数
# =============================================================================

def get_weather_data(location):
    """OpenWeatherMap APIから天気情報を取得"""
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={WEATHER_API_KEY}&units=metric&lang=ja"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            weather_info = {
                "location": data["name"],
                "temp": round(data["main"]["temp"], 1),
                "humidity": data["main"]["humidity"],
                "precipitation": data.get("rain", {}).get("1h", 0),
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"]
            }
            return weather_info
        else:
            return None
    except Exception as e:
        print(f"Weather API Error: {e}")
        return None

def get_month_calendar(year, month):
    """指定された年月のカレンダーデータを取得"""
    cal = calendar.Calendar(firstweekday=6)
    month_days = cal.monthdayscalendar(year, month)
    weeknames = ['日', '月', '火', '水', '木', '金', '土']
    return month_days, weeknames

def generate_event_id(date, user_events):
    """新しいイベントIDを生成"""
    if date not in user_events or len(user_events[date]) == 0:
        return 1
    else:
        max_id = max(ev.get("id", 0) for ev in user_events[date])
        return max_id + 1

# =============================================================================
# ペットシステム定数
# =============================================================================

EXP_TABLE = {
    0: 1, 1: 3, 2: 5, 3: 10, 4: 20,
    5: 30, 6: 40, 7: 50, 8: 60, 9: 70,
}

def calculate_success_reward(duration_minutes):
    """予定達成時のコインの獲得数を計算"""
    if duration_minutes < 30:
        return 5
    elif duration_minutes < 60:
        return 10
    elif duration_minutes < 120:
        return 25
    elif duration_minutes < 180:
        return 48
    else:
        return 140

def calculate_failure_penalty(duration_minutes, current_level, pet_type):
    """予定失敗時のペナルティを計算"""
    death_threshold = 5 if pet_type == 1 else 3
    
    if current_level <= death_threshold:
        return {"dies": True, "level_down": 0}
    
    if duration_minutes < 30:
        level_down = 1
    elif duration_minutes < 60:
        level_down = 1
    elif duration_minutes < 120:
        level_down = 2
    elif duration_minutes < 180:
        level_down = 3
    else:
        level_down = 4
    
    return {"dies": False, "level_down": level_down}

BIRD_EVOLUTION_WEIGHTS = {
    1: 18, 2: 13, 3: 13, 4: 13, 5: 8,
    6: 8, 7: 8, 8: 8, 9: 8, 10: 3,
}

BEAST_EVOLUTION_WEIGHTS = {
    1: 30, 2: 25, 3: 20, 4: 8, 5: 4,
}

WATER_EVOLUTION_WEIGHTS = {
    1: 30, 2: 15, 3: 10, 4: 7, 5: 5,
}

FIRE_EVOLUTION_WEIGHTS = {
    1: 30, 2: 15, 3: 10, 4: 7, 5: 5,
}

STAR_EVOLUTION_WEIGHTS = {
    1: 30, 2: 25, 3: 15, 4: 7, 5: 5,
}

HYBRID_EVOLUTION_WEIGHTS = {
    1: 30, 2: 25, 3: 10, 4: 7, 5: 3,
}

EVOLUTION_WEIGHTS = {
    1: BIRD_EVOLUTION_WEIGHTS,
    2: BEAST_EVOLUTION_WEIGHTS,
    3: WATER_EVOLUTION_WEIGHTS,
    4: FIRE_EVOLUTION_WEIGHTS,
    5: STAR_EVOLUTION_WEIGHTS,
    6: HYBRID_EVOLUTION_WEIGHTS,
}

def get_evolution_type(pet_type):
    """重み付けに基づいて進化タイプを抽選"""
    weights = EVOLUTION_WEIGHTS.get(pet_type, {})
    if not weights:
        max_type = 10 if pet_type == 1 else 5
        return random.randint(1, max_type)
    
    evolution_types = list(weights.keys())
    weight_values = list(weights.values())
    
    return random.choices(evolution_types, weights=weight_values)[0]

def get_rarity_stars(image_name):
    """ペット画像からレアリティ星を計算"""
    import re
    
    bird_match = re.match(r'pet1/lv10_type(\d+)\.gif', image_name)
    if bird_match:
        evo_type = int(bird_match.group(1))
        weights = BIRD_EVOLUTION_WEIGHTS
        total_weight = sum(weights.values())
        probability = (weights.get(evo_type, 0) / total_weight) * 100
        return calculate_stars_from_probability(probability)
    
    other_match = re.match(r'pet(\d+)/lv5_type(\d+)\.gif', image_name)
    if other_match:
        pet_type = int(other_match.group(1))
        evo_type = int(other_match.group(2))
        weights = EVOLUTION_WEIGHTS.get(pet_type, {})
        if weights:
            total_weight = sum(weights.values())
            probability = (weights.get(evo_type, 0) / total_weight) * 100
            return calculate_stars_from_probability(probability)
    
    return None

def calculate_stars_from_probability(probability):
    """出現確率から星の数を計算"""
    if probability <= 5:
        return 5
    elif probability <= 10:
        return 4
    elif probability <= 15:
        return 3
    elif probability <= 25:
        return 2
    else:
        return 1

PET_NAMES = {
    "pet1/lv1.gif": "ピヨコン", "pet1/lv2.gif": "フワモコ", "pet1/lv3.gif": "ピョンタ", "pet1/lv4.gif": "コロリン",
    "pet1/lv5.gif": "モフール", "pet1/lv6.gif": "ニャンゴ", "pet1/lv7.gif": "ワンダフ", "pet1/lv8.gif": "ドラゴニ", "pet1/lv9.gif": "フェニックス",
    "pet1/lv10_type1.gif": "キングレオン", "pet1/lv10_type2.gif": "にんじん", "pet1/lv10_type3.gif": "Miro",
    "pet1/lv10_type4.gif": "ナマタマゴ", "pet1/lv10_type5.gif": "サイケデリック伊藤", 
    "pet1/lv10_type6.gif": "神害近藤", "pet1/lv10_type7.gif": "P.A.N.Z.E.R.",
    "pet1/lv10_type8.gif": "モデル815", "pet1/lv10_type9.gif": "エレクトリック高橋", "pet1/lv10_type10.gif": "アルカヴィア",
    "pet1/death.jpg": "手羽先",
    "pet2/lv1.gif": "コロコロ", "pet2/lv2.gif": "パンパン", "pet2/lv3.gif": "フワリン", "pet2/lv4.gif": "モコモコ",
    "pet2/lv5_type1.gif": "子供のおもちゃ", "pet2/lv5_type2.gif": "神獣冴士岡", "pet2/lv5_type3.gif": "早スギタかりんとう",
    "pet2/lv5_type4.gif": "翼神龍ブラックドラゴン", "pet2/lv5_type5.gif": "ディオ!ヴァルミナート",
    "pet2/death.jpg": "丸焼き",
    "pet3/lv1.gif": "プクプク", "pet3/lv2.gif": "パブパブ", "pet3/lv3.gif": "スイスイ", "pet3/lv4.gif": "グルグル",
    "pet3/lv5_type1.gif": "ハロウィーンキャット", "pet3/lv5_type2.gif": "オーシャン", "pet3/lv5_type3.gif": "タイダル",
    "pet3/lv5_type4.gif": "チョコレートクッキー", "pet3/lv5_type5.gif": "雷波紋窟",
    "pet3/death.jpg": "干物",
    "pet4/lv1.gif": "メラメラ", "pet4/lv2.gif": "ホノホノ", "pet4/lv3.gif": "モエモエ", "pet4/lv4.gif": "ゴウゴウ",
    "pet4/lv5_type1.gif": "ファイアロード", "pet4/lv5_type2.gif": "フレイムキング", "pet4/lv5_type3.gif": "インフェルノ",
    "pet4/lv5_type4.gif": "ブレイズマスター", "pet4/lv5_type5.gif": "サンバースト",
    "pet4/death.jpg": "灰",
    "pet5/lv1.gif": "巻き物1", "pet5/lv2.gif": "巻き物2", "pet5/lv3.gif": "玉子", "pet5/lv4.gif": "タコ",
    "pet5/lv5_type1.gif": "スターライト", "pet5/lv5_type2.gif": "雲丹", "pet5/lv5_type3.gif": "流比寿",
    "pet5/lv5_type4.gif": "サーモン", "pet5/lv5_type5.gif": "いくら",
    "pet5/death.jpg": "流れ星",
    "pet6/lv1.gif": "ゴチャゴチャ", "pet6/lv2.gif": "ミックス", "pet6/lv3.gif": "ハイブリ", "pet6/lv4.gif": "カオスン",
    "pet6/lv5_type1.gif": "カクレミコ", "pet6/lv5_type2.gif": "茸影大明神", "pet6/lv5_type3.gif": "茸森帝",
    "pet6/lv5_type4.gif": "黴魘大権現", "pet6/lv5_type5.gif": "真茸皇マコトノスメラ",
    "pet6/death.jpg": "肥料",
}

PET_TYPES = {
    1: {"name": "鳥系統", "description": "地面を這う可愛いペット"},
    2: {"name": "獣系統", "description": "いかつく元気なペット"},
    3: {"name": "可愛い系統", "description": "可愛く癒されるペット"},
    4: {"name": "炎系統", "description": "情熱的で力強いペット"},
    5: {"name": "寿司系統", "description": "醤油がベストなペット"},
    6: {"name": "雑種系統", "description": "個性的で不思議なペット"},
}

def get_pet_image():
    """現在のペットの画像パスを取得"""
    pet = get_user_pet()
    pet_type = pet.get("pet_type")
    
    if not pet["alive"]:
        if pet["started"] and pet_type:
            img = f"pet{pet_type}/death.jpg"
            add_to_pokedex(img)
            return img
        return f"pet{pet_type}/egg.jpg" if pet_type else "pet1/egg.jpg"
    
    if pet["level"] == 0:
        return f"pet{pet_type}/egg.jpg" if pet_type else "pet1/egg.jpg"
    
    if pet_type == 1:
        if pet["level"] == 10:
            img = f"pet1/lv10_type{pet['evolution']}.gif"
            add_to_pokedex(img)
            return img
        else:
            img = f"pet1/lv{pet['level']}.gif"
            add_to_pokedex(img)
            return img
    
    if pet["level"] == 5:
        img = f"pet{pet_type}/lv5_type{pet['evolution']}.gif"
        add_to_pokedex(img)
        return img
    
    img = f"pet{pet_type}/lv{pet['level']}.gif"
    add_to_pokedex(img)
    return img

# =============================================================================
# 認証ルート
# =============================================================================

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        
        if not username or not password:
            return render_template("login.html", 
                error_message="ユーザー名とパスワードを入力してください",
                signup_mode=True)
        
        if len(password) < 5:
            return render_template("login.html", 
                error_message="パスワードは5文字以上にしてください",
                signup_mode=True)
        
        has_alpha = any(c.isalpha() for c in password)
        has_digit = any(c.isdigit() for c in password)
        
        if not (has_alpha and has_digit):
            return render_template("login.html", 
                error_message="パスワードは英字と数字を両方含む必要があります",
                signup_mode=True)
        
        if users_collection.find_one({"username": username}):
            return render_template("login.html", 
                error_message="このユーザー名は既に使用されています",
                signup_mode=True)
        
        users_collection.insert_one({
            "username": username,
            "password": generate_password_hash(password),
            "created_at": datetime.now(JST).isoformat()
        })
        
        session["username"] = username
        return redirect(url_for("redirect_to_current_month"))
    
    return render_template("login.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        
        user = users_collection.find_one({"username": username})
        if user and check_password_hash(user["password"], password):
            session["username"] = username
            return redirect(url_for("redirect_to_current_month"))
        else:
            return render_template("login.html", error_message="ユーザー名またはパスワードが間違っています")
    
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.pop("username", None)
    return redirect(url_for("login"))

# =============================================================================
# カレンダールート
# =============================================================================

@app.route("/", methods=["GET"])
def redirect_to_current_month():
    if "username" not in session:
        return redirect(url_for("login"))
    
    now = datetime.now(JST)
    return redirect(url_for("index_get", year=now.year, month=now.month))

@app.route("/calendar/<int:year>/<int:month>")
def index_get(year, month):
    if "username" not in session:
        return redirect(url_for("login"))
    
    username = session.get("username")
    user_events = get_user_events()
    user_goals = get_user_goals()
    user_locs = get_user_locations()
    
    weeks, weeknames = get_month_calendar(year, month)
    today = datetime.now(JST).strftime("%Y-%m-%d")
    today_events = user_events.get(today, [])
    today_events_sorted = sorted(today_events, key=lambda x: x.get("start_time", x.get("time", "00:00")))

    prev_year, prev_month = (year - 1, 12) if month == 1 else (year, month - 1)
    next_year, next_month = (year + 1, 1) if month == 12 else (year, month + 1)
    now_time = datetime.now(JST).strftime("%H:%M")

    pet = get_user_pet()

    month_key = f"{year}-{str(month).zfill(2)}"
    current_goal = user_goals.get(month_key, {"goal": "", "achieved": False})

    weather = get_weather_data("Tokyo")

    return render_template(
        "calendar.html",
        year=year, month=month, weeks=weeks, weeknames=weeknames,
        events=user_events, today=today, today_events=today_events_sorted,
        now_time=now_time,
        prev_link=url_for("index_get", year=prev_year, month=prev_month),
        next_link=url_for("index_get", year=next_year, month=next_month),
        pet=pet, image=get_pet_image(), exp_table=EXP_TABLE,
        username=username, current_goal=current_goal,
        month_key=month_key, weather=weather,
        locations=user_locs, pet_types=PET_TYPES
    )

# =============================================================================
# イベント管理ルート
# =============================================================================

@app.route("/add_event", methods=["POST"])
def add_event():
    if "username" not in session:
        return redirect(url_for("login"))
    
    user_events = get_user_events()
    date_str = request.form.get("date", "")
    start_time = request.form.get("start_time", "")
    end_time = request.form.get("end_time", "")
    event_text = request.form.get("event", "")
    location = request.form.get("location", "その他")

    if not re.match(r"\d{4}-\d{2}-\d{2}", date_str):
        return "日付形式が不正です", 400

    if start_time >= end_time:
        return "終了時間は開始時間より後にしてください", 400

    today_str = datetime.now(JST).strftime("%Y-%m-%d")
    now_time_str = datetime.now(JST).strftime("%H:%M")

    if date_str < today_str:
        return "過去の日付の予定は追加できません", 400
    if date_str == today_str and end_time < now_time_str:
        return "今日の過去時間の予定は追加できません", 400

    if date_str not in user_events:
        user_events[date_str] = []

    new_id = generate_event_id(date_str, user_events)
    user_events[date_str].append({
        "id": new_id, "start_time": start_time, "end_time": end_time, 
        "event": event_text, "location": location, "done": None
    })
    user_events[date_str].sort(key=lambda x: x["start_time"])
    save_user_events(user_events)

    dt = datetime.strptime(date_str, "%Y-%m-%d")
    return redirect(url_for("index_get", year=dt.year, month=dt.month))

@app.route("/update_event", methods=["POST"])
def update_event():
    if "username" not in session:
        return redirect(url_for("login"))
    
    user_events = get_user_events()
    date_str = request.form.get("date", "")
    event_id = int(request.form.get("id", 0))
    new_start_time = request.form.get("start_time", "")
    new_end_time = request.form.get("end_time", "")
    new_event = request.form.get("event", "")
    new_location = request.form.get("location", "その他")

    if new_start_time >= new_end_time:
        return "終了時間は開始時間より後にしてください", 400

    if date_str not in user_events:
        return "日付データなし", 404

    for ev in user_events[date_str]:
        if ev["id"] == event_id:
            ev["start_time"] = new_start_time
            ev["end_time"] = new_end_time
            ev["event"] = new_event
            ev["location"] = new_location
            save_user_events(user_events)
            break

    dt = datetime.strptime(date_str, "%Y-%m-%d")
    return redirect(url_for("index_get", year=dt.year, month=dt.month))

@app.route("/delete_event", methods=["POST"])
def delete_event():
    if "username" not in session:
        return jsonify({"error": "未ログイン"}), 401
    
    user_events = get_user_events()
    date_str = request.form.get("date", "")
    event_id = int(request.form.get("id", 0))

    if date_str not in user_events:
        return jsonify({"error": "日付データなし"}), 404

    user_events[date_str] = [ev for ev in user_events[date_str] if ev["id"] != event_id]
    
    if len(user_events[date_str]) == 0:
        del user_events[date_str]
    
    save_user_events(user_events)
    return jsonify({"success": True})

@app.route("/set_done", methods=["POST"])
def set_done():
    if "username" not in session:
        return jsonify({"error": "未ログイン"}), 401
    
    user_events = get_user_events()
    pet = get_user_pet()
    
    date_str = request.form.get("date", "")
    event_id = int(request.form.get("id", 0))
    done_value = request.form.get("done")

    if date_str not in user_events:
        return jsonify({"error": "該当イベントなし"}), 404

    for ev in user_events[date_str]:
        if ev.get("id") == event_id:
            if ev.get("done") is not None:
                return jsonify({"error": "すでに設定済み"}), 400

            ev["done"] = True if done_value == "true" else False
            save_user_events(user_events)
            
            start_time = ev.get("start_time", "00:00")
            end_time = ev.get("end_time", "23:59")
            start_h, start_m = map(int, start_time.split(":"))
            end_h, end_m = map(int, end_time.split(":"))
            duration_minutes = (end_h * 60 + end_m) - (start_h * 60 + start_m)

            if ev["done"]:
                pet["alive"] = True
                pet["started"] = True
                
                coin_reward = calculate_success_reward(duration_minutes)
                pet["coins"] += coin_reward
                
                pet["message"] = f"タスク完了!コインを{coin_reward}枚獲得!(コイン: {pet['coins']})"
            else:
                pet_type = pet.get("pet_type", 1)
                penalty = calculate_failure_penalty(duration_minutes, pet["level"], pet_type)
                
                if penalty["dies"]:
                    pet["alive"] = False
                    pet["level"] = 0
                    pet["exp"] = 0
                    pet["message"] = "ペットが死亡しました…"
                else:
                    level_down = penalty["level_down"]
                    pet["level"] = max(0, pet["level"] - level_down)
                    pet["exp"] = 0
                    pet["message"] = f"できなかった…レベルが{level_down}下がって{pet['level']}に!"
            
            save_user_pet(pet)
            break
    else:
        return jsonify({"error": "該当イベントなし"}), 404

    return jsonify({
        "success": True,
        "pet_level": pet["level"],
        "pet_alive": pet["alive"],
        "pet_coins": pet["coins"],
        "pet_image": get_pet_image(),
        "pet_message": pet["message"],
        "pet_exp": pet["exp"],
        "next_exp": EXP_TABLE.get(pet["level"], 0),
        "inventory": pet["inventory"]
    })

# =============================================================================
# 場所・目標管理ルート
# =============================================================================

@app.route("/get_locations", methods=["GET"])
def get_locations():
    if "username" not in session:
        return jsonify({"error": "未ログイン"}), 401
    
    locations = get_user_locations()
    return jsonify({"success": True, "locations": locations})

@app.route("/save_locations", methods=["POST"])
def save_locations_route():
    if "username" not in session:
        return jsonify({"error": "未ログイン"}), 401
    
    data = request.get_json()
    locations = data.get("locations", {})
    
    save_user_locations(locations)
    
    return jsonify({"success": True})

@app.route("/set_goal", methods=["POST"])
def set_goal():
    if "username" not in session:
        return jsonify({"error": "未ログイン"}), 401
    
    user_goals = get_user_goals()
    
    if request.is_json:
        data = request.get_json()
        month_key = data.get("month_key", "")
        goal_text = data.get("goal", "").strip()
    else:
        month_key = request.form.get("month_key", "")
        goal_text = request.form.get("goal", "").strip()
    
    if not goal_text:
        return jsonify({"error": "目標を入力してください"}), 400
    
    user_goals[month_key] = {"goal": goal_text, "achieved": False}
    save_user_goals(user_goals)
    
    return jsonify({"success": True, "goal": goal_text})

@app.route("/achieve_goal", methods=["POST"])
def achieve_goal():
    if "username" not in session:
        return jsonify({"error": "未ログイン"}), 401
    
    user_goals = get_user_goals()
    pet = get_user_pet()
    
    if request.is_json:
        data = request.get_json()
        month_key = data.get("month_key", "")
    else:
        month_key = request.form.get("month_key", "")
    
    if month_key not in user_goals:
        return jsonify({"error": "目標が設定されていません"}), 404
    
    if user_goals[month_key]["achieved"]:
        return jsonify({"error": "すでに達成済みです"}), 400
    
    user_goals[month_key]["achieved"] = True
    save_user_goals(user_goals)
    
    coin_reward = 1500
    pet["coins"] += coin_reward
    pet["message"] = f"月目標達成おめでとう!コインを{coin_reward}枚獲得!(コイン: {pet['coins']})"
    save_user_pet(pet)
    
    return jsonify({
        "success": True,
        "coins": pet["coins"],
        "message": pet["message"]
    })

# =============================================================================
# ショップルート
# =============================================================================

@app.route("/shop")
def shop():
    if "username" not in session:
        return redirect(url_for("login"))
    
    username = session.get("username")
    pet = get_user_pet()
    
    foods = [
        {"name": "基本の餌", "price": 10, "emoji": "🌾", "exp": 1},
        {"name": "おいしい餌", "price": 50, "emoji": "🌽", "exp": 6},
        {"name": "プレミアム餌", "price": 100, "emoji": "🍖", "exp": 14},
        {"name": "スペシャル餌", "price": 200, "emoji": "🎁", "exp": 32},
    ]
    
    return render_template(
        "shop.html",
        pet=pet,
        foods=foods,
        username=username,
        image=get_pet_image(),
        exp_table=EXP_TABLE
    )

@app.route("/buy_food", methods=["POST"])
def buy_food():
    if "username" not in session:
        return jsonify({"error": "未ログイン"}), 401
    
    pet = get_user_pet()
    data = request.get_json()
    food_name = data.get("food_name")
    quantity = data.get("quantity", 1)  # 個数を取得（デフォルト1）
    
    # 個数のバリデーション
    try:
        quantity = int(quantity)
        if quantity < 1 or quantity > 999:
            return jsonify({"error": "個数は1〜999の範囲で指定してください"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "無効な個数です"}), 400
    
    food_prices = {
        '基本の餌': 10,
        'おいしい餌': 30,
        'プレミアム餌': 100,
        'スペシャル餌': 200,
    }
    
    if food_name not in food_prices:
        return jsonify({"error": "無効な餌です"}), 400
    
    unit_price = food_prices[food_name]
    total_price = unit_price * quantity
    
    if pet["coins"] < total_price:
        return jsonify({"error": "コインが足りません"}), 400
    
    pet["coins"] -= total_price
    pet["inventory"][food_name] = pet["inventory"].get(food_name, 0) + quantity
    pet["message"] = f"『{food_name}』を{quantity}個購入しました！"
    save_user_pet(pet)
    
    return jsonify({
        "success": True,
        "coins": pet["coins"],
        "inventory": pet["inventory"],
        "message": pet["message"]
    })

# =============================================================================
# ペット管理ルート
# =============================================================================

@app.route("/pet")
def pet_detail():
    if "username" not in session:
        return redirect(url_for("login"))
    
    username = session.get("username")
    user_pokedex = get_user_pokedex()
    
    all_pets = []
    
    # ペット1系統(鳥系統 - 20種類)
    for level in range(1, 10):
        img_name = f"pet1/lv{level}.gif"
        育成_count = user_pokedex["育成_counts"].get(img_name, 0)
        all_pets.append({
            "image": img_name,
            "name": PET_NAMES.get(img_name, "???"),
            "discovered": img_name in user_pokedex["discovered"],
            "pet_type": 1,
            "育成_count": 育成_count,
            "rarity": None
        })
    
    for evo_type in range(1, 11):
        img_name = f"pet1/lv10_type{evo_type}.gif"
        育成_count = user_pokedex["育成_counts"].get(img_name, 0)
        rarity = get_rarity_stars(img_name)
        all_pets.append({
            "image": img_name,
            "name": PET_NAMES.get(img_name, "???"),
            "discovered": img_name in user_pokedex["discovered"],
            "pet_type": 1,
            "育成_count": 育成_count,
            "rarity": rarity
        })
    
    img_name = "pet1/death.jpg"
    育成_count = user_pokedex["育成_counts"].get(img_name, 0)
    all_pets.append({
        "image": img_name,
        "name": PET_NAMES.get(img_name, "???"),
        "discovered": img_name in user_pokedex["discovered"],
        "pet_type": 1,
        "育成_count": 育成_count,
        "rarity": None
    })
    
    # ペット2-6系統(各10種類)
    for pet_type in range(2, 7):
        for level in range(1, 5):
            img_name = f"pet{pet_type}/lv{level}.gif"
            育成_count = user_pokedex["育成_counts"].get(img_name, 0)
            all_pets.append({
                "image": img_name,
                "name": PET_NAMES.get(img_name, "???"),
                "discovered": img_name in user_pokedex["discovered"],
                "pet_type": pet_type,
                "育成_count": 育成_count,
                "rarity": None
            })
        
        for evo_type in range(1, 6):
            img_name = f"pet{pet_type}/lv5_type{evo_type}.gif"
            育成_count = user_pokedex["育成_counts"].get(img_name, 0)
            rarity = get_rarity_stars(img_name)
            all_pets.append({
                "image": img_name,
                "name": PET_NAMES.get(img_name, "???"),
                "discovered": img_name in user_pokedex["discovered"],
                "pet_type": pet_type,
                "育成_count": 育成_count,
                "rarity": rarity
            })
        
        img_name = f"pet{pet_type}/death.jpg"
        育成_count = user_pokedex["育成_counts"].get(img_name, 0)
        all_pets.append({
            "image": img_name,
            "name": PET_NAMES.get(img_name, "???"),
            "discovered": img_name in user_pokedex["discovered"],
            "pet_type": pet_type,
            "育成_count": 育成_count,
            "rarity": None
        })
    
    pet = get_user_pet()
    
    return render_template(
        "pet_detail.html",
        pet=pet, image=get_pet_image(), exp_table=EXP_TABLE,
        all_pets=all_pets, pet_names=PET_NAMES, username=username,
        pet_types=PET_TYPES
    )

@app.route("/start", methods=["POST"])
def start():
    if "username" not in session:
        return jsonify({"error": "未ログイン"}), 401
    
    data = request.get_json()
    pet_type = data.get("pet_type")
    
    if not pet_type or pet_type not in [1, 2, 3, 4, 5, 6]:
        return jsonify({"error": "ペットタイプが不正です"}), 400
    
    pet = get_user_pet()
    pet.update({
        "alive": True, "started": True, "level": 0,
        "food": 0, "exp": 0, "evolution": 1, "pet_type": pet_type,
        "message": "育成スタート!予定をこなして餌を集めよう!"
    })
    save_user_pet(pet)
    
    return jsonify({
        "alive": pet["alive"], "started": pet["started"],
        "level": pet["level"], "food": pet["food"],
        "exp": pet["exp"], "next_exp": EXP_TABLE[0],
        "image": get_pet_image(), "message": pet["message"],
        "pet_type": pet_type
    })

@app.route("/feed", methods=["POST"])
def feed():
    if "username" not in session:
        return jsonify({"error": "未ログイン"}), 401
    
    pet = get_user_pet()
    data = request.get_json() if request.is_json else {}
    food_name = data.get("food_name", "基本の餌")
    
    if not pet["alive"]:
        return jsonify({"message": "まだ育てていません。"})

    pet_type = pet.get("pet_type", 1)
    max_level = 10 if pet_type == 1 else 5

    if pet["level"] >= max_level:
        pet["message"] = "最終進化に到達!これ以上は成長できません。"
        return jsonify({
            "message": pet["message"], 
            "image": get_pet_image(),
            "exp": pet["exp"], 
            "next_exp": 0,
            "level": pet["level"],
            "inventory": pet["inventory"]
        })

    if pet["inventory"].get(food_name, 0) <= 0:
        pet["message"] = f"{food_name}がありません!"
        return jsonify({
            "message": pet["message"],
            "image": get_pet_image(),
            "exp": pet["exp"],
            "next_exp": EXP_TABLE.get(pet["level"], 0),
            "level": pet["level"],
            "inventory": pet["inventory"]
        })

    food_exp = {
        '基本の餌': 1,
        'おいしい餌': 6,
        'プレミアム餌': 14,
        'スペシャル餌': 32,
    }
    
    exp_gain = food_exp.get(food_name, 1)
    
    pet["inventory"][food_name] -= 1
    pet["exp"] += exp_gain
    
    start_level = pet["level"]
    levels_gained = 0

    # レベルアップ判定（ループ内では保存しない）
    while pet["level"] < max_level:
        required_exp = EXP_TABLE.get(pet["level"], 999)
        
        if pet["exp"] >= required_exp:
            pet["level"] += 1
            pet["exp"] -= required_exp
            levels_gained += 1
        else:
            break

    # 最終進化の場合、進化タイプを決定
    if pet["level"] == max_level:
        pet["evolution"] = get_evolution_type(pet_type)

    # ★重要: ここで一度だけデータベースに保存
    save_user_pet(pet)

    # ★重要: 保存後に最新データを再取得（データベース同期を保証）
    pet = get_user_pet()

    # ★修正: レベルアップした場合のみ、到達したレベルの画像を図鑑に追加
    if levels_gained > 0:
        # ★修正: 保存後に画像を取得（最新のレベル/進化タイプで取得）
        evolved_image = get_pet_image()
        
        # 図鑑に追加
        add_to_pokedex(evolved_image)
        
        # ★重要: 育成回数をカウント
        increment_育成_count(evolved_image)
        
        # ★デバッグ: カウント後のデータを確認
        print(f"[DEBUG] Fed pet, leveled up to {pet['level']}, image: {evolved_image}")
        updated_pokedex = get_user_pokedex()
        print(f"[DEBUG] 育成_counts for {evolved_image}: {updated_pokedex['育成_counts'].get(evolved_image, 0)}")
        
        # メッセージ生成
        if pet["level"] == max_level:
            pet["message"] = f"最終進化!タイプ{pet['evolution']}に進化した!!!(Lv.{start_level}→Lv.{pet['level']})" if levels_gained > 1 else f"最終進化!タイプ{pet['evolution']}に進化した!!!"
        elif levels_gained == 1:
            pet["message"] = f"レベルアップ!!!(レベル{pet['level']})"
        else:
            pet["message"] = f"{levels_gained}レベルアップ!!!(Lv.{start_level}→Lv.{pet['level']})"
        
        # ★重要: メッセージ更新後も保存
        save_user_pet(pet)
        
        return jsonify({
            "level": pet["level"],
            "exp": pet["exp"], 
            "next_exp": EXP_TABLE.get(pet["level"], 0) if pet["level"] < max_level else 0,
            "message": pet["message"], 
            "image": evolved_image,
            "pet_type": pet_type,
            "evolution": pet.get("evolution", 1),
            "inventory": pet["inventory"],
            "levels_gained": levels_gained,
            "start_level": start_level  # ★修正: これが開始レベル（Lv0など）
        })
    else:
        required_exp = EXP_TABLE.get(pet["level"], 0)
        pet["message"] = f"経験値+{exp_gain}! (EXP: {pet['exp']}/{required_exp})"
        save_user_pet(pet)

    next_exp = EXP_TABLE.get(pet["level"], 0)

    return jsonify({
        "level": pet["level"],
        "exp": pet["exp"], 
        "next_exp": next_exp,
        "message": pet["message"], 
        "image": get_pet_image(),
        "inventory": pet["inventory"]
    })

@app.route("/revive", methods=["POST"])
def revive():
    if "username" not in session:
        return jsonify({"error": "未ログイン"}), 401
    
    data = request.get_json()
    pet_type = data.get("pet_type")
    
    if not pet_type or pet_type not in [1, 2, 3, 4, 5, 6]:
        return jsonify({"error": "ペットタイプが不正です"}), 400
    
    pet = get_user_pet()
    current_food = pet["food"]
    
    pet.update({
        "alive": True, "started": True, "level": 0,
        "food": current_food, "exp": 0, "evolution": 1, "pet_type": pet_type,
        "message": f"卵から再スタート!餌は{current_food}個持っているよ!"
    })
    save_user_pet(pet)
    
    return jsonify({
        "alive": pet["alive"], "started": pet["started"],
        "image": get_pet_image(), "message": pet["message"],
        "level": 0, "food": current_food, "exp": 0,
        "next_exp": EXP_TABLE[0], "pet_type": pet_type
    })

@app.route("/reset", methods=["POST"])
def reset():
    if "username" not in session:
        return jsonify({"error": "未ログイン"}), 401
    
    pet = get_user_pet()
    pet.update({
        "alive": False, "started": False, "level": 0,
        "food": 0, "exp": 0, "evolution": 1, "pet_type": None,
        "message": "リセットしました。卵から始めよう!"
    })
    save_user_pet(pet)
    
    return jsonify({
        "alive": pet["alive"], "started": pet["started"],
        "image": "pet1/egg.jpg", "message": pet["message"],
        "food": 0, "exp": 0, "next_exp": EXP_TABLE[0]
    })
    
@app.route('/static/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json')

# =============================================================================
# アプリケーション起動
# =============================================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)