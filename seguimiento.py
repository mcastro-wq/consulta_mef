import urllib.request, csv, json, io
from datetime import datetime, timedelta

def generate_seguimiento_detallado():
    # URL del dataset según tu diccionario
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("🚀 Descargando datos según diccionario MEF...")
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=600) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            
            proyectos_data = []

            print("🔍 Mapeando todas las fases de gasto para Lambayeque...")
            for r in reader:
                # Filtrado por Lambayeque (según columna PLIEGO_NOMBRE o DEPARTAMENTO_META_NOMBRE)
                pliego = str(r.get('PLIEGO_NOMBRE', '')).upper()
                dpto_meta = str(r.get('DEPARTAMENTO_META_NOMBRE', '')).upper()
                
                if "LAMBAYEQUE" in pliego or "LAMBAYEQUE" in dpto_meta:
                    try:
                        def to_f(val): return float(val or 0)

                        # Aquí usamos EXACTAMENTE los nombres de tu diccionario
                        proyectos_data.append({
                            "TIPO": r.get('TIPO_ACT_PROY_NOMBRE', ''), # PROYECTO o PRODUCTO/ACTIVIDAD
                            "PRODUCTO_PROYECTO": r.get('PRODUCTO_PROYECTO', '0'),
                            "PRODUCTO_PROYECTO_NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "EJECUTORA_NOMBRE": r.get('EJECUTORA_NOMBRE', 'SIN EJECUTORA'),
                            "FUENTE_FINANCIAMIENTO_NOMBRE": r.get('FUENTE_FINANCIAMIENTO_NOMBRE', ''),
                            "MONTO_PIA": to_f(r.get('MONTO_PIA')),
                            "MONTO_PIM": to_f(r.get('MONTO_PIM')),
                            "MONTO_CERTIFICADO": to_f(r.get('MONTO_CERTIFICADO')),
                            "MONTO_COMPROMETIDO_ANUAL": to_f(r.get('MONTO_COMPROMETIDO_ANUAL')),
                            "MONTO_COMPROMETIDO": to_f(r.get('MONTO_COMPROMETIDO')), # Mensual
                            "MONTO_DEVENGADO": to_f(r.get('MONTO_DEVENGADO')),
                            "MONTO_GIRADO": to_f(r.get('MONTO_GIRADO')),
                            "MES_EJE": r.get('MES_EJE', '1')
                        })
                    except ValueError:
                        continue

            hora_peru = datetime.now() - timedelta(hours=5)
            fecha_texto = hora_peru.strftime("%d/%m/%Y %H:%M")

            objeto_final = {
                "fecha_extraccion": fecha_texto,
                "proyectos": proyectos_data
            }

            with open('data_proyectos.json', 'w', encoding='utf-8') as f:
                json.dump(objeto_final, f, indent=2, ensure_ascii=False)
            
            print(f"✅ ¡Éxito! JSON generado con {len(proyectos_data)} registros.")

    except Exception as e:
        print(f"🚨 Error: {e}")

if __name__ == "__main__":
    generate_seguimiento_detallado()
