import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

/*
  VERSÃO PREPARADA PARA PRODUÇÃO
  - Persistência em LocalStorage (simula backend)
  - Estrutura preparada para futura API
  - Controle simples de login
  - Organização de código mais escalável
*/

const STORAGE_KEY = "empresa_carros_data_v1";

export default function OrganizacaoCarrosApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState({ user: "", password: "" });

  const [cars, setCars] = useState([]);
  const [projects, setProjects] = useState([]);
  const [availableResources, setAvailableResources] = useState([]);

  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editedProjectName, setEditedProjectName] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newResource, setNewResource] = useState("");

  const [form, setForm] = useState({
    plate: "",
    model: "",
    resources: [],
  });

  const [draggedCar, setDraggedCar] = useState(null);

  /* ==========================
     PERSISTÊNCIA (SIMULA BACKEND)
  ========================== */

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setCars(data.cars || []);
      setProjects(data.projects || []);
      setAvailableResources(data.availableResources || []);
    } else {
      // Dados iniciais padrão
      setProjects([
        { id: "p1", name: "Projeto A" },
        { id: "p2", name: "Projeto B" },
      ]);
      setAvailableResources([
        "Suporte de escada",
        "Capota",
        "Tração 4x4",
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cars, projects, availableResources })
    );
  }, [cars, projects, availableResources]);

  /* ==========================
     AUTENTICAÇÃO SIMPLES
     (substituir por backend real depois)
  ========================== */

  const handleLogin = () => {
    if (login.user === "admin" && login.password === "admin") {
      setIsAuthenticated(true);
    } else {
      alert("Usuário ou senha inválidos");
    }
  };

  /* ==========================
     CRUD PROJETOS
  ========================== */

  const addProject = () => {
    if (!newProject) return;
    setProjects([...projects, { id: Date.now().toString(), name: newProject }]);
    setNewProject("");
  };

  const deleteProject = (projectId) => {
    setProjects(projects.filter((p) => p.id !== projectId));
    setCars(
      cars.map((car) =>
        car.projectId === projectId ? { ...car, projectId: null } : car
      )
    );
  };

  const saveProjectEdit = () => {
    setProjects(
      projects.map((p) =>
        p.id === editingProjectId ? { ...p, name: editedProjectName } : p
      )
    );
    setEditingProjectId(null);
  };

  /* ==========================
     CRUD CARROS
  ========================== */

  const addCar = () => {
    if (!form.plate || !form.model) return;
    setCars([
      ...cars,
      { id: Date.now().toString(), ...form, projectId: null },
    ]);
    setForm({ plate: "", model: "", resources: [] });
  };

  const deleteCar = (id) => {
    setCars(cars.filter((c) => c.id !== id));
  };

  const toggleResource = (resource) => {
    if (form.resources.includes(resource)) {
      setForm({
        ...form,
        resources: form.resources.filter((r) => r !== resource),
      });
    } else {
      setForm({
        ...form,
        resources: [...form.resources, resource],
      });
    }
  };

  const addResourceOption = () => {
    if (!newResource) return;
    if (!availableResources.includes(newResource)) {
      setAvailableResources([...availableResources, newResource]);
    }
    setNewResource("");
  };

  /* ==========================
     DRAG AND DROP
  ========================== */

  const onDrop = (projectId) => {
    if (!draggedCar) return;
    setCars(
      cars.map((car) =>
        car.id === draggedCar ? { ...car, projectId } : car
      )
    );
    setDraggedCar(null);
  };

  const renderCar = (car) => (
    <motion.div
      key={car.id}
      draggable
      onDragStart={() => setDraggedCar(car.id)}
      whileHover={{ scale: 1.03 }}
      className="cursor-move"
    >
      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">🚗 {car.model}</p>
              <p>Placa: {car.plate}</p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteCar(car.id)}
            >
              X
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            {car.resources.length > 0 ? (
              car.resources.map((r, i) => <p key={i}>✔ {r}</p>)
            ) : (
              <p>Sem recursos adicionais</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  /* ==========================
     TELA DE LOGIN
  ========================== */

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-96 rounded-2xl shadow-xl">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-center">Login Sistema</h2>
            <Input
              placeholder="Usuário"
              value={login.user}
              onChange={(e) => setLogin({ ...login, user: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Senha"
              value={login.password}
              onChange={(e) => setLogin({ ...login, password: e.target.value })}
            />
            <Button className="w-full" onClick={handleLogin}>
              Entrar
            </Button>
            <p className="text-xs text-center text-gray-500">
              (login padrão: admin / admin)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ==========================
     SISTEMA PRINCIPAL
  ========================== */

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="space-y-4">
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-lg font-bold">Cadastrar Carro</h2>
            <Input
              placeholder="Modelo"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
            <Input
              placeholder="Placa"
              value={form.plate}
              onChange={(e) => setForm({ ...form, plate: e.target.value })}
            />

            <div>
              <p className="text-sm font-semibold mb-2">Recursos</p>
              <div className="border rounded-xl p-3 space-y-2 max-h-40 overflow-auto">
                {availableResources.map((resource, index) => (
                  <label key={index} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.resources.includes(resource)}
                      onChange={() => toggleResource(resource)}
                    />
                    {resource}
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Novo recurso"
                  value={newResource}
                  onChange={(e) => setNewResource(e.target.value)}
                />
                <Button onClick={addResourceOption}>+</Button>
              </div>
            </div>

            <Button className="w-full" onClick={addCar}>
              Adicionar Carro
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-lg font-bold">Criar Projeto / Local</h2>
            <Input
              placeholder="Nome do projeto"
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
            />
            <Button className="w-full" onClick={addProject}>
              Adicionar Projeto
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-3">Carros Não Alocados</h2>
            <div className="space-y-3">
              {cars
                .filter((c) => !c.projectId)
                .map((car) => renderCar(car))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(project.id)}
          >
            <Card className="rounded-2xl shadow-xl min-h-[250px]">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  {editingProjectId === project.id ? (
                    <Input
                      value={editedProjectName}
                      onChange={(e) => setEditedProjectName(e.target.value)}
                      onBlur={saveProjectEdit}
                    />
                  ) : (
                    <h2
                      className="text-lg font-bold cursor-pointer"
                      onClick={() => {
                        setEditingProjectId(project.id);
                        setEditedProjectName(project.name);
                      }}
                    >
                      {project.name}
                    </h2>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteProject(project.id)}
                  >
                    X
                  </Button>
                </div>

                <div className="space-y-3">
                  {cars
                    .filter((c) => c.projectId === project.id)
                    .map((car) => renderCar(car))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}