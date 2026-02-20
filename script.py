import urllib.request
import urllib.parse
import json

def update_data():
    resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f"
    
    # Consulta SQL específica: GORE Lambayeque con proyectos activos
    sql = f"""
    SELECT "DEPARTAMENTO_EJECUTORA_NOMBRE", "PRODUCTO_PROYECTO_NOMBRE", "MONTO_PIM", "MONTO_DEVENGADO_ANO_EJE", "FUNCION_NOMBRE"
    FROM "{resource_id}" 
    WHERE "SECTOR_NOMBRE" LIKE 'GOBIERNOS REGIONALES' 
    AND "DEPARTAMENTO_EJECUTORA_NOMBRE" = 'LAMBAYEQUE'
    AND "MONTO_PIM" > 0 
    ORDER BY "MONTO_PIM" DESC
    LIMIT 500
    """
    
    params = urllib.parse.urlencode({'sql': sql})
    url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?{params}"
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("🛰️ Conectando con la API del MEF...")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=45) as response:
            res_data = json.loads(response.read().decode())
            
            # La respuesta de la API del MEF viene dentro de result -> records
            records = res_data.get('result', {}).get('records', [])
            
            processed = []
            for r in records:
                pim = float(r.get('MONTO_PIM', 0) or 0)
                dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                
                processed.append({
                    "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                    "DEPARTAMENTO": r.get('DEPARTAMENTO_EJECUTORA_NOMBRE', 'LAMBAYEQUE'),
                    "FUNCION": r.get('FUNCION_NOMBRE', 'OTROS'),
                    "pim": pim,
                    "devengado": dev,
                    "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                })

            # Guardamos el JSON que consumirá tu Dashboard
            with open('data_mef.json', 'w', encoding='utf-8') as f:
                json.dump(processed, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Éxito: {len(processed)} proyectos de Lambayeque actualizados.")

    except Exception as e:
        print(f"🚨 Fallo crítico: {e}")
        # No sobreescribimos con error para no borrar la última data buena en GitHub
        raise e 

if __name__ == "__main__":
    update_data()
