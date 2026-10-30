import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.simulation import SimulationScenario
from app.schemas.simulation import (
    SimulationRunRequest, SimulationResult, SimulationSaveRequest, SimulationScenarioResponse
)
from app.api.dependencies import get_current_user
from app.services.simulation_service import SimulationService

router = APIRouter(prefix="/simulations", tags=["What-If Simulator Engine"])

@router.post("/run", response_model=SimulationResult)
def run_simulation(
    req: SimulationRunRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return SimulationService.run_what_if_simulation(
        user=user,
        params=req.parameters,
        db=db,
        scenario_name=req.scenario_name or "What-If Scenario"
    )

@router.post("/save", response_model=SimulationScenarioResponse, status_code=status.HTTP_201_CREATED)
def save_simulation_scenario(
    req: SimulationSaveRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scenario = SimulationScenario(
        user_id=user.id,
        name=req.name,
        description=req.description,
        modified_parameters=json.dumps(req.simulation_result.modified_parameters),
        baseline_prediction=json.dumps(req.simulation_result.baseline_prediction.model_dump()),
        simulated_prediction=json.dumps(req.simulation_result.simulated_prediction.model_dump()),
        impact_summary=json.dumps(req.simulation_result.impact.model_dump())
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)

    return SimulationScenarioResponse(
        id=scenario.id,
        user_id=scenario.user_id,
        name=scenario.name,
        description=scenario.description,
        baseline_snapshot_id=scenario.baseline_snapshot_id,
        modified_parameters=json.loads(scenario.modified_parameters),
        baseline_prediction=json.loads(scenario.baseline_prediction),
        simulated_prediction=json.loads(scenario.simulated_prediction),
        impact_summary=json.loads(scenario.impact_summary),
        created_at=scenario.created_at,
        updated_at=scenario.updated_at
    )

@router.get("", response_model=List[SimulationScenarioResponse])
def get_saved_scenarios(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scenarios = db.query(SimulationScenario).filter(
        SimulationScenario.user_id == user.id
    ).order_by(SimulationScenario.created_at.desc()).all()

    resp = []
    for s in scenarios:
        resp.append(
            SimulationScenarioResponse(
                id=s.id,
                user_id=s.user_id,
                name=s.name,
                description=s.description,
                baseline_snapshot_id=s.baseline_snapshot_id,
                modified_parameters=json.loads(s.modified_parameters),
                baseline_prediction=json.loads(s.baseline_prediction),
                simulated_prediction=json.loads(s.simulated_prediction),
                impact_summary=json.loads(s.impact_summary),
                created_at=s.created_at,
                updated_at=s.updated_at
            )
        )
    return resp

@router.delete("/{scenario_id}", status_code=status.HTTP_200_OK)
def delete_scenario(
    scenario_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scen = db.query(SimulationScenario).filter(
        SimulationScenario.id == scenario_id,
        SimulationScenario.user_id == user.id
    ).first()
    if not scen:
        raise HTTPException(status_code=404, detail="Scenario not found")

    db.delete(scen)
    db.commit()
    return {"message": "Scenario deleted successfully"}
