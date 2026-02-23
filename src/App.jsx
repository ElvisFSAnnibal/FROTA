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
  const [sidebarOpen, setSidebarOpen] = useState(false); // ← ALTERADO PARA FALSE

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

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*");

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      const { data: carsData, error: carsError } = await supabase
        .from("cars")
        .select("*");

      if (carsError) throw carsError;
      setCars(carsData || []);

      const { data: resourcesData, error: resourcesError } = await supabase
        .from("resources")
        .select("name");

      if (resourcesError) throw resourcesError;
      setAvailableResources(resourcesData?.map((r) => r.name) || []);

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

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLogin({ user: "", password: "" });
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
      <Card className="rounded-xl shadow-md bg-slate-800 border-slate-700">
        <CardContent className="p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold text-white">🚗 {car.model}</p>
              <p className="text-xs text-teal-300">Placa: {car.plate}</p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteCar(car.id)}
              className="rounded-lg bg-red-600 hover:bg-red-700"
            >
              ✕
            </Button>
          </div>

          <div className="text-xs text-slate-400 space-y-1">
            {car.resources && car.resources.length > 0 ? (
              car.resources.map((r, i) => <p key={i}>✓ {r}</p>)
            ) : (
              <p>Sem recursos</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-4">
          <div className="animate-spin text-5xl">⏳</div>
          <p className="text-teal-300 font-semibold">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <Card className="w-96 rounded-2xl shadow-2xl border-0 bg-slate-800">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-teal-400">🚗 FROTA</h1>
              <p className="text-sm text-slate-400 mt-1">Sistema de Gerenciamento</p>
            </div>
            <Input
              placeholder="Usuário"
              value={login.user}
              onChange={(e) => setLogin({ ...login, user: e.target.value })}
              className="rounded-lg bg-slate-700 border-slate-600 text-white placeholder-slate-500"
            />
            <Input
              type="password"
              placeholder="Senha"
              value={login.password}
              onChange={(e) => setLogin({ ...login, password: e.target.value })}
              className="rounded-lg bg-slate-700 border-slate-600 text-white placeholder-slate-500"
            />
            <Button 
              className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3" 
              onClick={handleLogin}
            >
              Entrar
            </Button>
            <p className="text-xs text-center text-slate-500">
              (login padrão: <strong>admin</strong> / <strong>admin</strong>)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* BARRA DE TÍTULO */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-teal-600 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 max-w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-teal-400 hover:text-teal-300"
              title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              {sidebarOpen ? "☰ Fechar" : "☰ Menu"}
            </button>
            <h1 className="text-2xl font-bold text-white">
              <span className="text-teal-400">FROTA</span> - Sistema de Gerenciamento
            </h1>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Sair
          </Button>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex">
        {/* SIDEBAR (Menu Lateral) */}
        <motion.div
          initial={{ width: sidebarOpen ? 380 : 0 }}
          animate={{ width: sidebarOpen ? 380 : 0 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-800 border-r border-teal-600 overflow-hidden shadow-xl"
        >
          {sidebarOpen && (
            <div className="w-96 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
              {/* Seção: Cadastrar Carro */}
              <Card className="rounded-xl shadow-lg bg-slate-700 border-slate-600">
                <CardContent className="p-5 space-y-4">
                  <h2 className="text-lg font-bold text-teal-400">📋 Cadastrar Carro</h2>
                  <Input
                    placeholder="Modelo"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="rounded-lg bg-slate-600 border-slate-500 text-white placeholder-slate-400"
                  />
                  <Input
                    placeholder="Placa"
                    value={form.plate}
                    onChange={(e) => setForm({ ...form, plate: e.target.value })}
                    className="rounded-lg bg-slate-600 border-slate-500 text-white placeholder-slate-400"
                  />

                  <div>
                    <p className="text-sm font-semibold mb-3 text-teal-300">Recursos</p>
                    <div className="border border-slate-600 rounded-lg p-3 space-y-2 max-h-40 overflow-auto bg-slate-600">
                      {availableResources.map((resource, index) => (
                        <label key={index} className="flex items-center gap-2 text-sm cursor-pointer text-white hover:text-teal-300">
                          <input
                            type="checkbox"
                            checked={form.resources.includes(resource)}
                            onChange={() => toggleResource(resource)}
                            className="w-4 h-4 rounded border-teal-500 accent-teal-500"
                          />
                          {resource}
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Input
                        placeholder="Novo recurso"
                        value={newResource}
                        onChange={(e) => setNewResource(e.target.value)}
                        className="rounded-lg bg-slate-600 border-slate-500 text-white placeholder-slate-400 text-sm"
                      />
                      <Button onClick={addResourceOption} className="px-3 bg-teal-600 hover:bg-teal-700">+</Button>
                    </div>
                  </div>

                  <Button 
                    className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold" 
                    onClick={addCar}
                  >
                    ➕ Adicionar Carro
                  </Button>
                </CardContent>
              </Card>

              {/* Seção: Criar Projeto */}
              <Card className="rounded-xl shadow-lg bg-slate-700 border-slate-600">
                <CardContent className="p-5 space-y-4">
                  <h2 className="text-lg font-bold text-teal-400">🏢 Criar Projeto</h2>
                  <Input
                    placeholder="Nome do projeto"
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    className="rounded-lg bg-slate-600 border-slate-500 text-white placeholder-slate-400"
                  />
                  <Button 
                    className="w-full rounded-lg bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold" 
                    onClick={addProject}
                  >
                    ➕ Adicionar Projeto
                  </Button>
                </CardContent>
              </Card>

              {/* Seção: Carros Não Alocados */}
              <Card className="rounded-xl shadow-lg bg-slate-700 border-slate-600">
                <CardContent className="p-5">
                  <h2 className="text-lg font-bold text-teal-400 mb-4">📍 Não Alocados</h2>
                  <div className="space-y-3">
                    {cars
                      .filter((c) => !c.project_id)
                      .map((car) => renderCar(car))}
                    {cars.filter((c) => !c.project_id).length === 0 && (
                      <p className="text-slate-500 text-center py-4">Nenhum carro</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>

        {/* CONTEÚDO PRINCIPAL (Projetos) */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6"> {/* ← ALTERADO PARA 4 COLUNAS */}
            {projects.map((project) => (
              <div
                key={project.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(project.id)}
              >
                <Card className="rounded-xl shadow-xl min-h-[350px] hover:shadow-2xl transition-shadow bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      {editingProjectId === project.id ? (
                        <Input
                          autoFocus
                          value={editedProjectName}
                          onChange={(e) => setEditedProjectName(e.target.value)}
                          onBlur={saveProjectEdit}
                          className="rounded-lg font-bold text-lg bg-slate-700 border-teal-500 text-white"
                        />
                      ) : (
                        <h2
                          className="text-xl font-bold cursor-pointer hover:text-teal-400 transition-colors flex items-center gap-2 text-white"
                          onClick={() => {
                            setEditingProjectId(project.id);
                            setEditedProjectName(project.name);
                          }}
                        >
                          📦 {project.name}
                        </h2>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteProject(project.id)}
                        className="rounded-lg bg-red-600 hover:bg-red-700"
                      >
                        🗑
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {cars
                        .filter((c) => c.project_id === project.id)
                        .map((car) => renderCar(car))}
                      {cars.filter((c) => c.project_id === project.id).length === 0 && (
                        <p className="text-slate-500 text-center py-12 text-sm border-2 border-dashed border-slate-600 rounded-lg">
                          Arraste carros aqui
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}