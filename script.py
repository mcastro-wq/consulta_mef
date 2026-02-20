import urllib.request, csv, json, io
from datetime import datetime

def update_data():
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2025-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        print("📥 Descargando datos del MEF...")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=300) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            
            processed = []
            for r in reader:
                # Filtro Lambayeque (14)
                if str(r.get('DEPARTAMENTO_EJECUTORA', '')).strip() == '14':
                    try:
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                        
                        processed.append({
                            "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "anio": r.get('ANO_EJE', '2025'),
                            "sector": r.get('SECTOR_NOMBRE', 'OTROS'),
                            "pim": pim,
                            "devengado": dev,
                            "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                        })
                    except:
                        continue
            
            # --- ESTRUCTURA CON FECHA Y HORA ---
            # Restamos 5 horas al UTC de GitHub para tener la hora de Perú
            hora_peru = datetime.now() - timedelta(hours=5)
            
            output = {
                "ultima_actualizacion": hora_peru.strftime("%d/%m/%Y %H:%M"),
                "proyectos": processed
            }
            # Guardamos todo en un diccionario para que JS lo lea fácilmente
            
            with open('data_mef.json', 'w', encoding='utf-8') as f:
                json.dump(output, f, indent=2, ensure_ascii=False)
                
            print(f"✅ ¡Éxito! {len(processed)} proyectos procesados.")
            print(f"⏰ Actualización registrada: {output['ultima_actualizacion']}")
            
    except Exception as e:
        print(f"🚨 Error crítico: {e}")
        exit(1)

if __name__ == "__main__":
    update_data()
