import urllib.request
import urllib.parse
import json

def update_data():
    resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f"
    
    # Consulta en una sola línea y más simple para evitar el Error 500
    sql = f'SELECT "DEPARTAMENTO_EJECUTORA_NOMBRE", "PRODUCTO_PROYECTO_NOMBRE", "MONTO_PIM", "MONTO_DEVENGADO_ANO_EJE", "FUNCION_NOMBRE" FROM "{resource_id}" WHERE "DEPARTAMENTO_EJECUTORA_NOMBRE" = \'LAMBAYEQUE\' AND "SECTOR_NOMBRE" = \'GOBIERNOS REGIONALES\' AND "MONTO_PIM" > 0 LIMIT 1000'
    
    query_params = urllib.parse.urlencode({'sql': sql})
    url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?{query_params}"
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("🛰️ Intentando conectar con el servidor del MEF...")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=60) as response:
            res_data = json.loads(response.read().decode())
            
            # El MEF a veces devuelve los datos directamente en 'result' o en 'result' -> 'records'
            # Esta línea maneja ambos casos para mayor seguridad
            result = res_data.get('result', {})
            records = result.get('records', []) if isinstance(result, dict) else res_data.get('records', [])
            
            if not records:
                print("⚠️ No se encontraron registros. Revisa los filtros.")
                return

            processed = []
            for r in records:
                try:
                    pim = float(r.get('MONTO_PIM', 0) or 0)
                    dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                    
                    processed.append({
                        "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'S/N'),
                        "DEPARTAMENTO": r.get('DEPARTAMENTO_EJECUTORA_NOMBRE', 'LAMBAYEQUE'),
                        "FUNCION": r.get('FUNCION_NOMBRE', 'GENERAL'),
                        "pim": pim,
                        "devengado": dev,
                        "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                    })
                except:
                    continue

            with open('data_mef.json', 'w', encoding='utf-8') as f:
                json.dump(processed, f, indent=2, ensure_ascii=False)
            
            print(f"✅ ¡Éxito! Se guardaron {len(processed)} proyectos.")

    except Exception as e:
        print(f"🚨 Error detectado: {e}")
        # Importante: No lanzar 'raise' aquí para que la Action no marque 'failed' 
        # si es solo un bache temporal del servidor del MEF.
        exit(1)

if __name__ == "__main__":
    update_data()
