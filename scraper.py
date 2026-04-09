import requests
from bs4 import BeautifulSoup
import json

def scrapear_ssi_mef(cui):
    # URL que devuelve el detalle técnico de la inversión
    url = f"https://ofi5.mef.gob.pe/ssi/Home/ArquitecturaCUI?codigo={cui}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
        "Referer": "https://ofi5.mef.gob.pe/ssi/"
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        # El contenido suele ser una vista parcial HTML o JSON dependiendo del endpoint
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Ejemplo de extracción de datos generales del proyecto
        # Nota: Los selectores dependen de la estructura actual del HTML retornado
        data = {
            "CUI": cui,
            "Proyecto": soup.find("span", {"id": "lblNombreProyecto"}).text.strip() if soup.find("span", {"id": "lblNombreProyecto"}) else "No encontrado",
            "Estado": soup.find("span", {"id": "lblEstado"}).text.strip() if soup.find("span", {"id": "lblEstado"}) else "N/A",
            # Aquí puedes agregar más campos buscando por IDs o clases
        }
        
        return data

    except Exception as e:
        return {"error": str(e)}

# Uso:
cui_ejemplo = "2199528" # Reemplaza con un CUI real
resultado = scrapear_ssi_mef(cui_ejemplo)
print(json.dumps(resultado, indent=4, ensure_ascii=False))
