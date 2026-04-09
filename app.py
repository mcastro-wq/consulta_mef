from flask import Flask, jsonify, render_template, request
import requests
from bs4 import BeautifulSoup
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def scrapear_ssi_mef(cui):
    url = f"https://ofi5.mef.gob.pe/ssi/Home/ArquitecturaCUI?codigo={cui}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
        "Referer": "https://ofi5.mef.gob.pe/ssi/"
    }
    try:
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extracción avanzada basada en tus capturas
        nombre = soup.find("span", {"id": "lblNombreProyecto"}).text.strip() if soup.find("span", {"id": "lblNombreProyecto"}) else "No encontrado"
        estado = soup.find("span", {"id": "lblEstado"}).text.strip() if soup.find("span", {"id": "lblEstado"}) else "N/A"
        
        # Captura de costos (basado en etiquetas comunes del SSI)
        # Nota: El SSI usa IDs específicos para los montos de la Fase de Ejecución
        costo_actualizado = soup.find("span", {"id": "lblCostoActualizado"}).text.strip() if soup.find("span", {"id": "lblCostoActualizado"}) else "0.00"
        situacion = soup.find("span", {"id": "lblSituacion"}).text.strip() if soup.find("span", {"id": "lblSituacion"}) else "N/A"
        
        # Limpieza de números (quitar comas)
        costo_num = float(costo_actualizado.replace(',', '')) if costo_actualizado != "0.00" else 0.0

        return {
            "cui": cui,
            "nombre": nombre,
            "pim": costo_num, # Usamos el Costo Actualizado como referencia de inversión
            "devengado": 0.0, # El devengado suele requerir un clic extra en el SSI real
            "situacion": situacion,
            "estado": estado
        }
    except Exception as e:
        print(f"Error: {e}")
        return None

@app.route('/api/buscar/<cui>')
def buscar_cui(cui):
    resultado = scrapear_ssi_mef(cui)
    if resultado:
        return jsonify(resultado)
    return jsonify({"error": "No se encontró data en el MEF"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
