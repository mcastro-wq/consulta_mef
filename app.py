from flask import Flask, jsonify, render_template, request
import requests
from bs4 import BeautifulSoup
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Permite que el HTML se comunique con el Python

def scrapear_ssi_mef(cui):
    url = f"https://ofi5.mef.gob.pe/ssi/Home/ArquitecturaCUI?codigo={cui}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
        "Referer": "https://ofi5.mef.gob.pe/ssi/"
    }
    try:
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extracción de datos (Basado en la estructura del SSI)
        # Nota: Ajusta los selectores según la tabla real del MEF
        data = {
            "cui": cui,
            "nombre": soup.find("span", {"id": "lblNombreProyecto"}).text.strip() if soup.find("span", {"id": "lblNombreProyecto"}) else "Proyecto no encontrado",
            "pim": 0, # Estos datos suelen estar en tablas, habría que iterar soup.find_all('td')
            "devengado": 0,
            "gobierno": "N/A",
            "estado": soup.find("span", {"id": "lblEstado"}).text.strip() if soup.find("span", {"id": "lblEstado"}) else "N/A"
        }
        return data
    except Exception as e:
        return None

@app.route('/')
def index():
    return render_template('seg_pro.html')

@app.route('/api/buscar/<cui>')
def buscar_cui(cui):
    resultado = scrapear_ssi_mef(cui)
    if resultado:
        return jsonify(resultado)
    return jsonify({"error": "No se encontró data"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
