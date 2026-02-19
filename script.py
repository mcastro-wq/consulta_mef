import requests
import json
import sys

resource_id = '749cb9b6-604f-485b-bb06-4b906b44034f'
# Aumentamos el límite para capturar más proyectos
url = f'https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search?resource_id={resource_id}&limit=300'

def update_data():
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            records = response.json().get('result', {}).get('records', [])
            if records:
                proyectos = []
                for r in records:
                    pim = float(r.get('MONTO_PIM', 0) or 0)
                    dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                    avance = (dev / pim * 100) if pim > 0 else 0
                    
                    # Guardamos el nombre del proyecto y el departamento
                    proyectos.append({
                        "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                        "DEPARTAMENTO": r.get('DEPARTAMENTO_META_NOMBRE', 'OTROS'),
                        "pim": pim,
                        "devengado": dev,
                        "avance": round(avance, 2)
                    })
                
                with open('data_mef.json', 'w', encoding='utf-8') as f:
                    json.dump(proyectos, f, indent=2)
                return
    except:
        pass
    
    # Backup por si el MEF falla
    backup = [{"NOMBRE": "OBRA EJEMPLO LAMBAYEQUE", "DEPARTAMENTO": "LAMBAYEQUE", "pim": 500000, "devengado": 100000, "avance": 20.0}]
    with open('data_mef.json', 'w', encoding='utf-8') as f:
        json.dump(backup, f, indent=2)

if __name__ == "__main__":
    update_data()
