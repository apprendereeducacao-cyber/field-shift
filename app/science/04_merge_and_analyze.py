# SI-assisted — Merge season climate data with IBGE yield and analyze

import csv
import os
import math

DIR = os.path.dirname(os.path.abspath(__file__))

safras = {}
with open(os.path.join(DIR, "safras_cruzalta.csv")) as f:
    for row in csv.DictReader(f):
        safras[int(row["safra"])] = row

ibge = {}
with open(os.path.join(DIR, "ibge_soja_cruzalta.csv")) as f:
    for row in csv.DictReader(f):
        ibge[int(row["ano"])] = int(row["kg_ha"])

merged = []
for year in sorted(set(safras.keys()) & set(ibge.keys())):
    s = safras[year]
    merged.append({
        "safra": year,
        "chuva_nov_mar_mm": float(s["chuva_nov_mar_mm"]),
        "dias_tmax_ge32": int(s["dias_tmax_ge32"]),
        "maior_veranico_dias": int(s["maior_veranico_dias"]),
        "kg_ha": ibge[year],
        "sacas_ha": round(ibge[year] / 60.0, 1),
    })

out = os.path.join(DIR, "chuva_x_produtividade.csv")
with open(out, "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["safra", "chuva_nov_mar_mm", "dias_tmax_ge32", "maior_veranico_dias", "kg_ha", "sacas_ha"])
    w.writeheader()
    w.writerows(merged)
print(f"Saved {out} — {len(merged)} matched seasons\n")

print(f"{'Safra':<7} {'Chuva mm':>10} {'Dias>=32':>9} {'Veranico':>9} {'sc/ha':>8}")
print("-" * 47)
for r in merged:
    print(f"{r['safra']:<7} {r['chuva_nov_mar_mm']:>10.1f} {r['dias_tmax_ge32']:>9} {r['maior_veranico_dias']:>9} {r['sacas_ha']:>8.1f}")

def pearson(xs, ys):
    n = len(xs)
    if n < 3:
        return float("nan")
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    dx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    dy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if dx == 0 or dy == 0:
        return float("nan")
    return num / (dx * dy)

chuvas = [r["chuva_nov_mar_mm"] for r in merged]
veranicos = [r["maior_veranico_dias"] for r in merged]
prods = [r["kg_ha"] for r in merged]
dias_q = [r["dias_tmax_ge32"] for r in merged]

print(f"\n--- Correlacoes (Pearson) ---")
print(f"Chuva nov-mar vs produtividade:    r = {pearson(chuvas, prods):.3f}")
print(f"Maior veranico vs produtividade:   r = {pearson(veranicos, prods):.3f}")
print(f"Dias Tmax>=32 vs produtividade:    r = {pearson(dias_q, prods):.3f}")

print(f"\n--- 5 safras de MENOR produtividade ---")
worst = sorted(merged, key=lambda r: r["kg_ha"])[:5]
for r in worst:
    print(f"  {r['safra']}: {r['sacas_ha']} sc/ha | chuva {r['chuva_nov_mar_mm']} mm | veranico {r['maior_veranico_dias']} dias | dias>=32: {r['dias_tmax_ge32']}")

def avg_period(rows, start, end):
    sub = [r for r in rows if start <= r["safra"] <= end]
    if not sub:
        return {}
    return {
        "n": len(sub),
        "chuva_media": round(sum(r["chuva_nov_mar_mm"] for r in sub) / len(sub), 1),
        "dias_quentes_media": round(sum(r["dias_tmax_ge32"] for r in sub) / len(sub), 1),
        "veranico_medio": round(sum(r["maior_veranico_dias"] for r in sub) / len(sub), 1),
        "prod_media_sc": round(sum(r["sacas_ha"] for r in sub) / len(sub), 1),
    }

p1 = avg_period(merged, 1982, 2001)
p2 = avg_period(merged, 2006, 2025)

print(f"\n--- Comparacao de periodos ---")
print(f"{'':>20} {'1982-2001':>12} {'2006-2025':>12}")
print(f"{'Safras (n)':>20} {p1.get('n','?'):>12} {p2.get('n','?'):>12}")
print(f"{'Chuva media mm':>20} {p1.get('chuva_media','?'):>12} {p2.get('chuva_media','?'):>12}")
print(f"{'Dias quentes media':>20} {p1.get('dias_quentes_media','?'):>12} {p2.get('dias_quentes_media','?'):>12}")
print(f"{'Veranico medio dias':>20} {p1.get('veranico_medio','?'):>12} {p2.get('veranico_medio','?'):>12}")
print(f"{'Produtividade sc/ha':>20} {p1.get('prod_media_sc','?'):>12} {p2.get('prod_media_sc','?'):>12}")
