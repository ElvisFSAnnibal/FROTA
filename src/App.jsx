import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function OrganizacaoCarrosApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState({ user: "", password: "" });
  const [loading, setLoading] = useState(true);

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
     CARREGAR DADOS AO INICIAR
  ========================== */

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      if (!supabase) {
        console.warn("Supabase não configurado, usando dados locais");
        setIsAuthenticated(true);
        loadLocalData();
        setLoading(false);
        return;
      }

      console.log("📥 Carregando dados do Supabase...");

      // Carregar projetos
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*");

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);
      console.log("✅ Projetos carregados:", projectsData);

      // Carregar carros
      const { data: carsData, error: carsError } = await supabase
        .from("cars")
        .select("*");

      if (carsError) throw carsError;
      setCars(carsData || []);
      console.log("✅ Carros carregados:", carsData);

      // Carregar recursos
      const { data: resourcesData, error: resourcesError } = await supabase
        .from("resources")
        .select("name");

      if (resourcesError) throw resourcesError;
      setAvailableResources(resourcesData?.map((r) => r.name) || []);
      console.log("✅ Recursos carregados:", resourcesData);

      setIsAuthenticated(true);
      console.log("✅ Dados carregados com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error.message);
      loadLocalData();
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalData = () => {
    const STORAGE_KEY = "empresa_carros_data_v1";
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setCars(data.cars || []);
      setProjects(data.projects || []);
      setAvailableResources(data.availableResources || []);
    } else {
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
  };

  const handleLogin = () => {
    if (login.user === "admin" && login.password === "admin") {
      setIsAuthenticated(true);
    } else {
      alert("Usuário ou senha inválidos");
    }
  };

  const addProject = async () => {
    if (!newProject) return;

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("projects")
          .insert([{ name: newProject }])
          .select();

        if (error) throw error;
        setProjects([...projects, data[0]]);
        console.log("✅ Projeto adicionado!");
      } else {
        const newProj = { id: Date.now().toString(), name: newProject };
        setProjects([...projects, newProj]);
      }

      setNewProject("");
    } catch (error) {
      console.error("❌ Erro ao adicionar projeto:", error.message);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", projectId);

        if (error) throw error;
      }

      setProjects(projects.filter((p) => p.id !== projectId));
      setCars(
        cars.map((car) =>
          car.project_id === projectId ? { ...car, project_id: null } : car
        )
      );
      console.log("✅ Projeto deletado!");
    } catch (error) {
      console.error("❌ Erro ao deletar projeto:", error.message);
    }
  };

  const saveProjectEdit = async () => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from("projects")
          .update({ name: editedProjectName })
          .eq("id", editingProjectId);

        if (error) throw error;
      }

      setProjects(
        projects.map((p) =>
          p.id === editingProjectId ? { ...p, name: editedProjectName } : p
        )
      );
      setEditingProjectId(null);
      console.log("✅ Projeto atualizado!");
    } catch (error) {
      console.error("❌ Erro ao atualizar projeto:", error.message);
    }
  };

  const addCar = async () => {
    if (!form.plate || !form.model) return;

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("cars")
          .insert([
            {
              plate: form.plate,
              model: form.model,
              resources: form.resources,
              project_id: null,
            },
          ])
          .select();

        if (error) throw error;
        setCars([...cars, data[0]]);
        console.log("✅ Carro adicionado!");
      } else {
        setCars([
          ...cars,
          { id: Date.now().toString(), ...form, project_id: null },
        ]);
      }

      setForm({ plate: "", model: "", resources: [] });
    } catch (error) {
      console.error("❌ Erro ao adicionar carro:", error.message);
    }
  };

  const deleteCar = async (id) => {
    try {
      if (supabase) {
        const { error } = await supabase.from("cars").delete().eq("id", id);

        if (error) throw error;
      }

      setCars(cars.filter((c) => c.id !== id));
      console.log("✅ Carro deletado!");
    } catch (error) {
      console.error("❌ Erro ao deletar carro:", error.message);
    }
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

  const addResourceOption = async () => {
    if (!newResource) return;

    try {
      if (availableResources.includes(newResource)) {
        alert("Recurso já existe!");
        return;
      }

      if (supabase) {
        const { data, error } = await supabase
          .from("resources")
          .insert([{ name: newResource }])
          .select();

        if (error) throw error;
        setAvailableResources([...availableResources, newResource]);
        console.log("✅ Recurso adicionado!");
      } else {
        setAvailableResources([...availableResources, newResource]);
      }

      setNewResource("");
    } catch (error) {
      console.error("❌ Erro ao adicionar recurso:", error.message);
    }
  };

  const onDrop = async (projectId) => {
    if (!draggedCar) return;

    try {
      if (supabase) {
        const { error } = await supabase
          .from("cars")
          .update({ project_id: projectId })
          .eq("id", draggedCar);

        if (error) throw error;
      }

      setCars(
        cars.map((car) =>
          car.id === draggedCar
            ? { ...car, project_id: projectId }
            : car
        )
      );
      setDraggedCar(null);
      console.log("✅ Carro movido!");
    } catch (error) {
      console.error("❌ Erro ao mover carro:", error.message);
    }
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
            {car.resources && car.resources.length > 0 ? (
              car.resources.map((r, i) => <p key={i}>✔ {r}</p>)
            ) : (
              <p>Sem recursos adicionais</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl">⏳</div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 bg-gray-50 min-h-screen">
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
                .filter((c) => !c.project_id)
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
                      className="text-lg font-bold cursor-pointer hover:text-blue-600"
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
                    .filter((c) => c.project_id === project.id)
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