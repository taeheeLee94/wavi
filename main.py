from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from warehouse_core import (
    load_grid,
    find_warehouse_cell,
    find_adjacent_corridor,
    coordinate_to_index,
    compute_all_pairwise,
    solve_tsp,
    reconstruct_full_route
)
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXCEL_PATH = "warehouse.xlsx"

if not os.path.exists(EXCEL_PATH):
    raise FileNotFoundError(f"엑셀 파일이 존재하지 않습니다: {EXCEL_PATH}")

grid, start_cells, max_row, max_col = load_grid(EXCEL_PATH)
if len(start_cells) != 1:
    raise ValueError("START 셀은 정확히 1개여야 합니다.")
start = start_cells[0]

@app.get("/")
def hello():
    return {"message": "warehouse navigation API"}

@app.get("/route")
def get_route(via: str = Query(..., description="경유지 목록, 쉼표로 구분 (예: a12,b3,C5)")):
    waypoint_strs = [x.strip() for x in via.split(",") if x.strip()]
    intermediate_nodes = []
    warehouse_inputs = []

    for ws_val in waypoint_strs:
        if ws_val[0].islower():
            warehouse_inputs.append(ws_val)
            wh_cell = find_warehouse_cell(ws_val, grid)
            if not wh_cell:
                return {"error": f"창고 '{ws_val}' 셀이 존재하지 않습니다."}
            corridor_cell = find_adjacent_corridor(wh_cell, grid)
            if not corridor_cell:
                return {"error": f"창고 '{ws_val}' 주변에 복도가 없습니다."}
            intermediate_nodes.append(corridor_cell)
        else:
            node = coordinate_to_index(ws_val.upper())
            if node not in grid:
                return {"error": f"복도 '{ws_val}' 해당 셀이 존재하지 않습니다."}
            intermediate_nodes.append(node)

    if not intermediate_nodes:
        return {"error": "유효한 경유지가 없습니다."}

    nodes = [start] + intermediate_nodes
    pairwise = compute_all_pairwise(nodes, grid)
    order, best_cost = solve_tsp(nodes, pairwise)
    if order is None:
        return {"error": "경유지를 모두 연결하는 경로를 찾을 수 없습니다."}

    full_route = reconstruct_full_route(order, nodes, pairwise)
    if full_route is None:
        return {"error": "경로 재구성에 실패했습니다."}

    grid_info = {}
    for (r, c), cell in grid.items():
        grid_info[f"{r},{c}"] = cell["type"]

    return {
        "start": start,
        "via": waypoint_strs,
        "order": order,
        "total_steps": best_cost,
        "route": full_route,
        "grid": grid_info
    }