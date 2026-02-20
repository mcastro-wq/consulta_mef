import urllib.request
import json

def update_data():
    resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f"
    # USAMOS EL ENLACE QUE SÍ CARGÓ
    url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search?resource_id={resource_id}&q=LAMBAYEQUE&limit=100"
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("🛰️ Conectando con el enlace verificado...")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode())
            
            # Extraemos los records de la estructura: result -> records
            records = res_data.get('result', {}).get('records', [])
            
            processed = []
            for r in records:
                # Filtro de seguridad: Solo Lambayeque y Gobiernos Regionales
                # (Ya que 'q' busca el texto en cualquier columna)
                if r.get('DEPARTAMENTO_EJECUTORA_NOMBRE') == 'LAMBAYEQUE' and r.get('SECTOR_NOMBRE') == 'GOBIERNOS REGIONALES':
                    pim = float(r.get('MONTO_PIM', 0) or 0)
                    dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                    
                    processed.append({
                        "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'S/N'),
                        "DEPARTAMENTO": "LAMBAYEQUE",
                        "pim": pim,
                        "devengado": dev,
                        "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                    })

            with open('data_mef.json', 'w', encoding='utf-8') as f:
                json.dump(processed, f, indent=2, ensure_ascii=False)
            
            print(f"✅ ¡Sincronizado! {len(processed)} proyectos de GORE Lambayeque guardados.")

    except Exception as e:
        print(f"🚨 Error: {e}")
        exit(1)

if __name__ == "__main__":
    update_data()
