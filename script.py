import urllib.request
import json
import time

def update_data():
    resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f"
    # Pedimos los datos sin SQL pesado para que el servidor no nos bloquee (Error 500)
    # Traemos 5000 registros para asegurar que Lambayeque esté incluido
    url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search?resource_id={resource_id}&limit=5000"
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    for intento in range(3):
        try:
            print(f"📡 Intento {intento+1}: Recolectando datos reales del MEF...")
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=60) as response:
                res_data = json.loads(response.read().decode())
                records = res_data.get('result', {}).get('records', [])
                
                # FILTRO REAL: Solo Lambayeque (Código 14) y Gobiernos Regionales
                processed = []
                for r in records:
                    # Usamos el código 14 que viste en la tabla (ID Lambayeque)
                    if str(r.get('DEPARTAMENTO_EJECUTORA')) == '14' and r.get('SECTOR_NOMBRE') == 'GOBIERNOS REGIONALES':
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                        
                        processed.append({
                            "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "DEPARTAMENTO": "LAMBAYEQUE",
                            "pim": pim,
                            "devengado": dev,
                            "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                        })

                if processed:
                    with open('data_mef.json', 'w', encoding='utf-8') as f:
                        json.dump(processed, f, indent=2, ensure_ascii=False)
                    print(f"✅ Éxito: {len(processed)} proyectos reales de Lambayeque actualizados.")
                    return
                else:
                    print("⚠️ Datos recibidos pero no se encontró Lambayeque en este bloque.")
        
        except Exception as e:
            print(f"❌ Error en el servidor del MEF: {e}. Reintentando...")
            time.sleep(10)
    exit(1)

if __name__ == "__main__":
    update_data()
