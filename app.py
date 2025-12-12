from flask import Flask, request, redirect, url_for, jsonify, render_template, session
import json
import re
from datetime import datetime
import os
import calendar
import random
import requests
from werkzeug.security import generate_password_hash, check_password_hash

# =============================================================================
# アプリケーション初期化
# =============================================================================

app = Flask(__name__)
app.secret_key = "your-secret-key-here-change-this"

# ファイルパス定義
SAVE_FILE = "events.json"
POKEDEX_FILE = "pokedex.json"
USERS_FILE = "users.json"
GOALS_FILE = "goals.json"
LOCATIONS_FILE = "locations.json"

# API設定
WEATHER_API_KEY = "YOUR_API_KEY_HERE"

# =============================================================================
# データ保存・読み込み関数
# =============================================================================

def save_events():
    """イベントデータをJSONファイルに保存"""
    with open(SAVE_FILE, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

def save_pokedex():
    """図鑑データをJSONファイルに保存"""
    with open(POKEDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(pokedex, f, ensure_ascii=False, indent=2)

def save_users():
    """ユーザーデータをJSONファイルに保存"""
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def save_goals():
    """目標データをJSONファイルに保存"""
    with open(GOALS_FILE, "w", encoding="utf-8") as f:
        json.dump(goals, f, ensure_ascii=False, indent=2)

def save_locations():
    """場所データをJSONファイルに保存"""
    with open(LOCATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(user_locations, f, ensure_ascii=False, indent=2)

# データ読み込み
if os.path.exists(SAVE_FILE):
    with open(SAVE_FILE, "r", encoding="utf-8") as f:
        events = json.load(f)
else:
    events = {}

if os.path.exists(POKEDEX_FILE):
    with open(POKEDEX_FILE, "r", encoding="utf-8") as f:
        pokedex = json.load(f)
else:
    pokedex = {}

if os.path.exists(USERS_FILE):
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        users = json.load(f)
else:
    users = {}

if os.path.exists(GOALS_FILE):
    with open(GOALS_FILE, "r", encoding="utf-8") as f:
        goals = json.load(f)
else:
    goals = {}

if os.path.exists(LOCATIONS_FILE):
    with open(LOCATIONS_FILE, "r", encoding="utf-8") as f:
        user_locations = json.load(f)
else:
    user_locations = {}

# =============================================================================
# データマイグレーション
# =============================================================================

def migrate_events_data():
    """既存イベントデータを新形式に変換"""
    modified = False
    for username in events:
        for date in events[username]:
            for event in events[username][date]:
                if "time" in event and "start_time" not in event:
                    old_time = event["time"]
                    event["start_time"] = old_time
                    try:
                        hours, minutes = map(int, old_time.split(":"))
                        end_hours = hours + 1
                        if end_hours >= 24:
                            end_hours = 23
                            minutes = 59
                        event["end_time"] = f"{end_hours:02d}:{minutes:02d}"
                    except:
                        event["end_time"] = "23:59"
                    del event["time"]
                    modified = True
                
                if "location" not in event:
                    event["location"] = "その他"
                    modified = True
    
    if modified:
        save_events()
        print("イベントデータを新形式に変換しました")

def migrate_pokedex_data():
    """図鑑データに育成回数を追加"""
    modified = False
    for username in pokedex:
        if "discovered" in pokedex[username] and "育成_counts" not in pokedex[username]:
            pokedex[username]["育成_counts"] = {}
            modified = True
    
    if modified:
        save_pokedex()
        print("図鑑データに育成回数を追加しました")

migrate_events_data()
migrate_pokedex_data()

# =============================================================================
# ユーザーデータ取得ヘルパー関数
# =============================================================================

def get_user_locations():
    """現在のユーザーの場所設定を取得"""
    username = session.get("username")
    if not username:
        return {
            "自宅": "#ef4444",
            "屋外": "#10b981",
            "外(屋内)": "#f59e0b",
            "オンライン": "#8b5cf6",
            "その他": "#64748b"
        }
    
    if username not in user_locations:
        user_locations[username] = {
            "自宅": "#ef4444",
            "屋外": "#10b981",
            "外(屋内)": "#f59e0b",
            "オンライン": "#8b5cf6",
            "その他": "#64748b"
        }
        save_locations()
    
    return user_locations[username]

def get_user_pokedex():
    """現在のユーザーの図鑑データを取得"""
    username = session.get("username")
    if not username:
        return {"discovered": [], "育成_counts": {}}
    if username not in pokedex:
        pokedex[username] = {"discovered": [], "育成_counts": {}}
    if "育成_counts" not in pokedex[username]:
        pokedex[username]["育成_counts"] = {}
    return pokedex[username]

def add_to_pokedex(image_name):
    """図鑑に新しいペットを追加"""
    username = session.get("username")
    if not username:
        return
    
    user_pokedex = get_user_pokedex()
    if image_name not in user_pokedex["discovered"] and not image_name.startswith("egg"):
        user_pokedex["discovered"].append(image_name)
        save_pokedex()

def increment_育成_count(image_name):
    """ペットの育成回数をカウント"""
    username = session.get("username")
    if not username or image_name.startswith("egg"):
        return
    
    user_pokedex = get_user_pokedex()
    if image_name not in user_pokedex["育成_counts"]:
        user_pokedex["育成_counts"][image_name] = 0
    user_pokedex["育成_counts"][image_name] += 1
    save_pokedex()

def get_user_events():
    """現在のユーザーのイベントデータを取得"""
    username = session.get("username")
    if not username:
        return {}
    if username not in events:
        events[username] = {}
    return events[username]

def get_user_goals():
    """現在のユーザーの目標データを取得"""
    username = session.get("username")
    if not username:
        return {}
    if username not in goals:
        goals[username] = {}
    return goals[username]

def get_user_pet():
    """現在のユーザーのペットデータを取得"""
    username = session.get("username")
    if not username:
        return {
            "level": 0, "food": 0, "exp": 0, "coins": 0,  # coinsを追加
            "message": "ログインしてペットを育てよう!",
            "alive": False, "started": False, "pet_type": None, "evolution": 1,
            "inventory": {  # 餌のインベントリを追加
                '基本の餌': 0,
                'おいしい餌': 0,
                'プレミアム餌': 0,
                'スペシャル餌': 0,
            }
        }
    
    if username not in user_pets:
        user_pets[username] = {
            "level": 0, "food": 0, "exp": 0, "coins": 0,
            "message": "卵から育て始めよう!",
            "alive": False, "started": False, "pet_type": None, "evolution": 1,
            "inventory": {
                '基本の餌': 0,
                'おいしい餌': 0,
                'プレミアム餌': 0,
                'スペシャル餌': 0,
            }
        }
        
    # 既存データにcoinsとinventoryがない場合は追加
    if "coins" not in user_pets[username]:
        user_pets[username]["coins"] = 0
    if "inventory" not in user_pets[username]:
        user_pets[username]["inventory"] = {
            '基本の餌': 0,
            'おいしい餌': 0,
            'プレミアム餌': 0,
            'スペシャル餌': 0,
        }
    
    # 経験値フィールドが存在しない場合は追加
    if "exp" not in user_pets[username]:
        user_pets[username]["exp"] = 0
    
    return user_pets[username]

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

# レベルアップに必要な経験値テーブル
EXP_TABLE = {
    0: 5, 1: 7, 2: 10, 3: 14, 4: 20,
    5: 25, 6: 33, 7: 46, 8: 55, 9: 70,
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

# 進化確率設定（レアリティシステム）
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
    "pet2/lv5_type1.gif": "子供のおもちゃ", "pet2/lv5_type2.gif": "神獣冨士岡", "pet2/lv5_type3.gif": "早スギタかりんとう",
    "pet2/lv5_type4.gif": "翼神龍ブラックドラゴン", "pet2/lv5_type5.gif": "ディオ!ヴァルミナート",
    "pet2/death.jpg": "丸焼き",
    "pet3/lv1.gif": "プクプク", "pet3/lv2.gif": "パブパブ", "pet3/lv3.gif": "スイスイ", "pet3/lv4.gif": "グルグル",
    "pet3/lv5_type1.gif": "ハロウィーンキャット", "pet3/lv5_type2.gif": "オーシャン", "pet3/lv5_type3.gif": "タイダル",
    "pet3/lv5_type4.gif": "チョコレートクッキー", "pet3/lv5_type5.gif": "雷波紋突",
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

user_pets = {}

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

# ========================================================================
# ショップルート
# ========================================================================

@app.route("/shop")
def shop():
    if "username" not in session:
        return redirect(url_for("login"))
    
    username = session.get("username")
    pet = get_user_pet()
    
    # 餌の商品リスト
    foods = [
        {"name": "基本の餌", "price": 1, "emoji": "$D83C$DF3E", "exp": 1},
        {"name": "おいしい餌", "price": 50, "emoji": "$D83C$DF3D", "exp": 3},
        {"name": "プレミアム餌", "price": 100, "emoji": "$D83C$DF56", "exp": 5},
        {"name": "スペシャル餌", "price": 200, "emoji": "$D83C$DF81", "exp": 10},
    ]
    
    return render_template(
        "shop.html",
        pet=pet,
        foods=foods,
        username=username,
        image=get_pet_image(),
        exp_table=EXP_TABLE
    )

# ========================================================================
# 餌購入API
# ========================================================================

@app.route("/buy_food", methods=["POST"])
def buy_food():
    if "username" not in session:
        return jsonify({"error": "未ログイン"}), 401
    
    pet = get_user_pet()
    data = request.get_json()
    food_name = data.get("food_name")
    
    # 餌の価格設定
    food_prices = {
        '基本の餌': 1,
        'おいしい餌': 50,
        'プレミアム餌': 100,
        'スペシャル餌': 200,
    }
    
    if food_name not in food_prices:
        return jsonify({"error": "無効な餌です"}), 400
    
    price = food_prices[food_name]
    
    # コインが足りるかチェック
    if pet["coins"] < price:
        return jsonify({"error": "コインが足りません"}), 400
    
    # 購入処理
    pet["coins"] -= price
    pet["inventory"][food_name] = pet["inventory"].get(food_name, 0) + 1
    pet["message"] = f"『{food_name}』を購入しました!"
    
    return jsonify({
        "success": True,
        "coins": pet["coins"],
        "inventory": pet["inventory"],
        "message": pet["message"]
    })

# =============================================================================
# 認証ルート
# =============================================================================

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        
        if not username or not password:
            return render_template("login.html", error_message="ユーザー名とパスワードを入力してください")
        
        if len(password) < 5:
            return render_template("login.html", error_message="パスワードは5文字以上にしてください")
        
        if username in users:
            return render_template("login.html", error_message="このユーザー名は既に使用されています")
        
        users[username] = {
            "password": generate_password_hash(password),
            "created_at": datetime.now().isoformat()
        }
        save_users()
        
        session["username"] = username
        return redirect(url_for("redirect_to_current_month"))
    
    return render_template("login.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        
        if username in users and check_password_hash(users[username]["password"], password):
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
    
    now = datetime.now()
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
    today = datetime.today().strftime("%Y-%m-%d")
    today_events = user_events.get(today, [])
    today_events_sorted = sorted(today_events, key=lambda x: x.get("start_time", x.get("time", "00:00")))

    prev_year, prev_month = (year - 1, 12) if month == 1 else (year, month - 1)
    next_year, next_month = (year + 1, 1) if month == 12 else (year, month + 1)
    now_time = datetime.now().strftime("%H:%M")

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

    today_str = datetime.today().strftime("%Y-%m-%d")
    now_time_str = datetime.now().strftime("%H:%M")

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
    save_events()

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
            save_events()
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
    
    save_events()
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
            save_events()
            
            # 予定の時間(分)を計算
            start_time = ev.get("start_time", "00:00")
            end_time = ev.get("end_time", "23:59")
            start_h, start_m = map(int, start_time.split(":"))
            end_h, end_m = map(int, end_time.split(":"))
            duration_minutes = (end_h * 60 + end_m) - (start_h * 60 + start_m)

            if ev["done"]:
                # 成功: 時間に応じてコインを付与
                pet["alive"] = True
                pet["started"] = True
                
                coin_reward = calculate_success_reward(duration_minutes)
                pet["coins"] += coin_reward
                
                pet["message"] = f"タスク完了!コインを{coin_reward}枚獲得!(コイン: {pet['coins']})"
            else:
                # 失敗: 時間に応じてペナルティを適用
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
    
    username = session.get("username")
    data = request.get_json()
    locations = data.get("locations", {})
    
    user_locations[username] = locations
    save_locations()
    
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
    save_goals()
    
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
    save_goals()
    
    # 月目標達成で1500コイン付与
    coin_reward = 1500
    pet["coins"] += coin_reward
    pet["message"] = f"月目標達成おめでとう!コインを{coin_reward}枚獲得!(コイン: {pet['coins']})"
    
    return jsonify({
        "success": True,
        "coins": pet["coins"],
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

    # インベントリに餌があるかチェック
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

    # 餌の経験値設定
    food_exp = {
        '基本の餌': 1,
        'おいしい餌': 3,
        'プレミアム餌': 5,
        'スペシャル餌': 10,
    }
    
    exp_gain = food_exp.get(food_name, 1)
    
    # 餌を消費
    pet["inventory"][food_name] -= 1
    pet["exp"] += exp_gain
    
    start_level = pet["level"]
    levels_gained = 0
    
    # 飛び級処理: 経験値が複数レベル分ある場合は連続してレベルアップ
    while pet["level"] < max_level:
        required_exp = EXP_TABLE.get(pet["level"], 999)
        
        if pet["exp"] >= required_exp:
            pet["level"] += 1
            pet["exp"] -= required_exp
            levels_gained += 1
            
            # 各レベルで進化画像を記録（ただし育成回数はカウントしない）
            # if pet["level"] < max_level:
            #     temp_image = get_pet_image()
            #     increment_育成_count(temp_image)
        else:
            break
    
    # レベルアップした場合
    if levels_gained > 0:
        # 最終進化の場合は進化タイプを決定
        if pet["level"] == max_level:
            pet["evolution"] = get_evolution_type(pet_type)
            pet["message"] = f"最終進化!タイプ{pet['evolution']}に進化した!!!(Lv.{start_level}→Lv.{pet['level']})"
        elif levels_gained == 1:
            pet["message"] = f"レベルアップ!!!(レベル{pet['level']})"
        else:
            pet["message"] = f"{levels_gained}レベルアップ!!!(Lv.{start_level}→Lv.{pet['level']})"
        
        # 最終的な進化後の画像を取得して育成回数をカウント（1回だけ）
        evolved_image = get_pet_image()
        increment_育成_count(evolved_image)
        
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
            "start_level": start_level
        })
    else:
        # レベルアップしなかった場合
        required_exp = EXP_TABLE.get(pet["level"], 0)
        pet["message"] = f"経験値+{exp_gain}! (EXP: {pet['exp']}/{required_exp})"

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
    return jsonify({
        "alive": pet["alive"], "started": pet["started"],
        "image": "pet1/egg.jpg", "message": pet["message"],
        "food": 0, "exp": 0, "next_exp": EXP_TABLE[0]
    })

# =============================================================================
# アプリケーション起動
# =============================================================================

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")