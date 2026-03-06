import urllib.request, csv, json, io
from datetime import datetime, timedelta

def update_data():
    # URL para 2026m
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("📥 Descargando datos 2026...")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=300) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            
            processed = []
            for r in reader:
                # Filtro por Lambayeque (14)
                if str(r.get('DEPARTAMENTO_EJECUTORA', '')).strip() == '14':
                    try:
                        # Extraemos montos usando los nombres exactos del diccionario 2026
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        cert = float(r.get('MONTO_CERTIFICADO', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO', 0) or 0)
                        
                        # Guardamos con los nombres largos que tu HTML ya usa
                        processed.append({
                            "PRODUCTO_PROYECTO": r.get('PRODUCTO_PROYECTO', '0'),
                            "PRODUCTO_PROYECTO_NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "ANO_EJE": "2026",
                            "EJECUTORA_NOMBRE": r.get('EJECUTORA_NOMBRE', 'OTROS'),
                            "MONTO_PIM": pim,
                            "MONTO_CERTIFICADO": cert,
                            "MONTO_DEVENGADO": dev,
                            "MONTO_GIRADO": float(r.get('MONTO_GIRADO', 0) or 0),
                            "TIPO_ACT_PROY_NOMBRE": r.get('TIPO_ACT_PROY_NOMBRE', 'PROYECTO')
                        })
                    except:
                        continue
            
            hora_peru = datetime.now() - timedelta(hours=5)
            output = {
                "ultima_actualizacion": hora_peru.strftime("%d/%m/%Y %H:%M"),
                "proyectos": processed
            }
            
            with open('data_proyectos.json', 'w', encoding='utf-8') as f:
                json.dump(output, f, indent=2, ensure_ascii=False)
            print(f"✅ ¡Éxito! {len(processed)} registros procesados.")
            
    except Exception as e:
        print(f"🚨 Error: {e}")

if __name__ == "__main__":
    update_data()
