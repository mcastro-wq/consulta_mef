import urllib.request, csv, json, io
from datetime import datetime, timedelta

def generate_seguimiento_detallado():
    # URL de Gasto Diario
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Gasto-Diario.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    # Código del Pliego Lambayeque
    CODIGO_PLIEGO_LAMBAYEQUE = "452"
    
    try:
        print(f"🚀 Descargando Gasto Diario y filtrando por Pliego {CODIGO_PLIEGO_LAMBAYEQUE}...")
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=600) as response:
            # Importante: Algunos CSV del MEF usan latin-1 o utf-8-sig
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            
            # Limpiamos los nombres de las columnas por si tienen espacios invisibles
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            
            proyectos_data = []

            for r in reader:
                # Filtro por Pliego
                if r.get('PLIEGO') == CODIGO_PLIEGO_LAMBAYEQUE:
                    try:
                        def to_f(val): 
                            if not val: return 0.0
                            try:
                                return float(str(val).replace(',', ''))
                            except:
                                return 0.0

                        # Mapeo corregido según el estándar de archivos del MEF
                        proyectos_data.append({
                            "TIPO": r.get('TIPO_ACT_PROY_NOMBRE', ''),
                            "PRODUCTO_PROYECTO": r.get('PRODUCTO_PROYECTO', ''),
                            "PRODUCTO_PROYECTO_NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            
                            # Intentamos obtener el nombre de la ejecutora de varias formas comunes
                            "EJECUTORA_NOMBRE": r.get('EJECUTORA_NOMBRE') or r.get('NOMBRE_EJECUTORA') or r.get('EJECUTORA_DESC', 'SIN NOMBRE'),
                            
                            "FUENTE_FINANCIAMIENTO_NOMBRE": r.get('FUENTE_FINANCIAMIENTO_NOMBRE', ''),
                            
                            # Montos (Si no salen, es porque la columna se llama distinto en el CSV)
                            "MONTO_PIA": to_f(r.get('MONTO_PIA') or r.get('PIA')),
                            "MONTO_PIM": to_f(r.get('MONTO_PIM') or r.get('PIM')),
                            "MONTO_CERTIFICADO": to_f(r.get('MONTO_CERTIFICADO') or r.get('CERTIFICADO')),
                            "MONTO_COMPROMETIDO_ANUAL": to_f(r.get('MONTO_COMPROMETIDO_ANUAL') or r.get('COMPROMETIDO_ANUAL')),
                            "MONTO_COMPROMETIDO": to_f(r.get('MONTO_COMPROMETIDO') or r.get('COMPROMETIDO')),
                            "MONTO_DEVENGADO": to_f(r.get('MONTO_DEVENGADO') or r.get('DEVENGADO')),
                            "MONTO_GIRADO": to_f(r.get('MONTO_GIRADO') or r.get('GIRADO')),
                            
                            "MES_EJE": r.get('MES_EJE', '1'),
                            "ANO_EJE": r.get('ANO_EJE', '2026')
                        })
                    except Exception as ex:
                        continue

            # Ordenar por Devengado de mayor a menor para que el JSON sea útil
            proyectos_data.sort(key=lambda x: x['MONTO_DEVENGADO'], reverse=True)

            hora_peru = datetime.now() - timedelta(hours=5)
            objeto_final = {
                "ultima_actualizacion": hora_peru.strftime("%d/%m/%Y %H:%M"),
                "pliego": "452 - GOBIERNO REGIONAL DE LAMBAYEQUE",
                "total_filas": len(proyectos_data),
                "proyectos": proyectos_data
            }

            with open('data_gasto_lambayeque.json', 'w', encoding='utf-8') as f:
                json.dump(objeto_final, f, indent=2, ensure_ascii=False)
            
            print(f"✅ ¡Éxito! Archivo generado con {len(proyectos_data)} registros.")

    except Exception as e:
        print(f"🚨 Error crítico: {e}")

if __name__ == "__main__":
    generate_seguimiento_detallado()
