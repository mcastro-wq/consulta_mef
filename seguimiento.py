import urllib.request, csv, json, io
from datetime import datetime, timedelta

def to_f(val):
    if val is None or str(val).strip() == "":
        return 0.0
    try:
        # Limpia comas y espacios, permitiendo conversión a número
        return float(str(val).replace(',', '').strip())
    except:
        return 0.0

def generate_seguimiento_detallado():
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Gasto-Diario.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    CODIGO_PLIEGO_LAMBAYEQUE = "452"
    
    try:
        print(f"🚀 Iniciando extracción blindada para Lambayeque...")
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=600) as response:
            content = response.read().decode('utf-8-sig')
            
            # 1. Leemos el CSV
            reader = csv.DictReader(io.StringIO(content))
            
            # 2. LIMPIEZA EXTREMA DE CABECERAS
            # Eliminamos espacios, saltos de línea y convertimos a mayúsculas
            reader.fieldnames = [f.strip().replace('\n', '').replace('\r', '').upper() for f in reader.fieldnames]
            
            print(f"📋 Columnas encontradas y limpiadas: {reader.fieldnames[:10]}...")

            proyectos_data = []

            for r in reader:
                # 3. Creamos una fila limpia para búsqueda interna
                row = {k.upper(): v for k, v in r.items() if k}
                
                if row.get('PLIEGO') == CODIGO_PLIEGO_LAMBAYEQUE:
                    # 4. FORZAMOS la aparición del campo en el diccionario
                    # Si 'MONTO_PIA' no existe, buscará 'PIA' como respaldo
                    proyecto_obj = {
                        "PRODUCTO_PROYECTO": row.get('PRODUCTO_PROYECTO', ''),
                        "PRODUCTO_PROYECTO_NOMBRE": row.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                        "ANO_EJE": row.get('ANO_EJE', '2026'),
                        "EJECUTORA_NOMBRE": row.get('EJECUTORA_NOMBRE') or row.get('NOMBRE_EJECUTORA') or "SIN NOMBRE",
                        
                        # OBLIGAMOS a que la llave exista en el JSON final
                        "MONTO_PIA": to_f(row.get('MONTO_PIA') or row.get('PIA')),
                        "MONTO_PIM": to_f(row.get('MONTO_PIM') or row.get('PIM')),
                        "MONTO_CERTIFICADO": to_f(row.get('MONTO_CERTIFICADO') or row.get('CERTIFICADO')),
                        "MONTO_DEVENGADO": to_f(row.get('MONTO_DEVENGADO') or row.get('DEVENGADO')),
                        "MONTO_GIRADO": to_f(row.get('MONTO_GIRADO') or row.get('GIRADO')),
                        "TIPO_ACT_PROY_NOMBRE": row.get('TIPO_ACT_PROY_NOMBRE', 'PROYECTO')
                    }
                    proyectos_data.append(proyecto_obj)

            # 5. Generación del JSON
            hora_peru = datetime.now() - timedelta(hours=5)
            output = {
                "ultima_actualizacion": hora_peru.strftime("%d/%m/%Y %H:%M"),
                "proyectos": proyectos_data
            }

            with open('data_gasto_lambayeque.json', 'w', encoding='utf-8') as f:
                json.dump(output, f, indent=2, ensure_ascii=False)
            
            print(f"✅ ¡Éxito! JSON generado. Registros: {len(proyectos_data)}")

    except Exception as e:
        print(f"🚨 Error: {e}")

if __name__ == "__main__":
    generate_seguimiento_detallado()
