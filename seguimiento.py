import urllib.request, csv, json, io
from datetime import datetime, timedelta

def generate_seguimiento_detallado():
    # URL del dataset 2026 (Asegúrate de que el año sea el correcto en el servidor del MEF)
    # https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Seguimiento-PI.csv
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Gasto-Diario.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    # El código de pliego para el Gobierno Regional de Lambayeque es 452
    CODIGO_PLIEGO_LAMBAYEQUE = "452"
    
    try:
        print(f"🚀 Descargando datos y filtrando por Pliego {CODIGO_PLIEGO_LAMBAYEQUE}...")
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=600) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            
            proyectos_data = []

            for r in reader:
                # FILTRO EXACTO POR CÓDIGO DE PLIEGO
                # Usamos .get('PLIEGO') para obtener el código numérico
                pliego_codigo = str(r.get('PLIEGO', '')).strip()
                
                if pliego_codigo == CODIGO_PLIEGO_LAMBAYEQUE:
                    try:
                        def to_f(val): return float(val or 0)

                        proyectos_data.append({
                            "TIPO": r.get('TIPO_ACT_PROY_NOMBRE', ''),
                            "PRODUCTO_PROYECTO": r.get('PRODUCTO_PROYECTO', '0'),
                            "PRODUCTO_PROYECTO_NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "EJECUTORA_NOMBRE": r.get('EJECUTORA_NOMBRE', 'SIN EJECUTORA'),
                            "FUENTE_FINANCIAMIENTO_NOMBRE": r.get('FUENTE_FINANCIAMIENTO_NOMBRE', ''),
                            "MONTO_PIA": to_f(r.get('MONTO_PIA')),
                            "MONTO_PIM": to_f(r.get('MONTO_PIM')),
                            "MONTO_CERTIFICADO": to_f(r.get('MONTO_CERTIFICADO')),
                            "MONTO_COMPROMETIDO_ANUAL": to_f(r.get('MONTO_COMPROMETIDO_ANUAL')),
                            "MONTO_COMPROMETIDO": to_f(r.get('MONTO_COMPROMETIDO')),
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
                "pliego_filtrado": CODIGO_PLIEGO_LAMBAYEQUE,
                "total_registros": len(proyectos_data),
                "proyectos": proyectos_data
            }

            with open('data_proyectos_lambayeque.json', 'w', encoding='utf-8') as f:
                json.dump(objeto_final, f, indent=2, ensure_ascii=False)
            
            print(f"✅ ¡Éxito! JSON generado con {len(proyectos_data)} registros del GORE Lambayeque.")

    except Exception as e:
        print(f"🚨 Error: {e}")

if __name__ == "__main__":
    generate_seguimiento_detallado()
