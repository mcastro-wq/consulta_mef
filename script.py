import urllib.request
import csv
import json
import io

def update_data():
    url_directa = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2025-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("📥 Descargando data completa del MEF...")
        req = urllib.request.Request(url_directa, headers=headers)
        
        with urllib.request.urlopen(req, timeout=300) as response:
            content = response.read().decode('utf-8-sig')
            # Usamos DictReader pero limpiamos los nombres de las columnas primero
            f = io.StringIO(content)
            reader = csv.DictReader(f)
            # Limpiar espacios en blanco de los nombres de las columnas
            reader.fieldnames = [field.strip() for field in reader.fieldnames]
            
            processed = []
            print(f"🔍 Columnas detectadas: {reader.fieldnames}")
            
            for r in reader:
                # Filtro por Departamento 14 (Lambayeque)
                if str(r.get('DEPARTAMENTO_EJECUTORA')) == '14':
                    try:
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                        
                        # Extraemos el año del campo ANO_EJE o ANO_EJECUCION
                        anio_valor = r.get('ANO_EJE') or r.get('ANO_EJECUCION') or "2025"
                        
                        processed.append({
                            "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "anio": str(anio_valor), 
                            "pim": pim,
                            "devengado": dev,
                            "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                        })
                    except:
                        continue

            if processed:
                with open('data_mef.json', 'w', encoding='utf-8') as f:
                    json.dump(processed, f, indent=2, ensure_ascii=False)
                print(f"✅ ¡Éxito! {len(processed)} proyectos guardados con el campo 'anio'.")
            else:
                print("⚠️ No se encontraron datos para Lambayeque.")

    except Exception as e:
        print(f"🚨 Error crítico: {e}")
        exit(1)

if __name__ == "__main__":
    update_data()
