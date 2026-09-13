import { Route, Routes } from "react-router-dom";
import { AccesoGate } from "./components/AccesoGate";
import { Layout } from "./components/Layout";
import { Agregar } from "./pages/Agregar";
import { Historial } from "./pages/Historial";
import { Inventario } from "./pages/Inventario";
import { Productos } from "./pages/Productos";
import { Vender } from "./pages/Vender";

function App() {
  return (
    <AccesoGate>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inventario />} />
          <Route path="vender" element={<Vender />} />
          <Route path="agregar" element={<Agregar />} />
          <Route path="historial" element={<Historial />} />
          <Route path="productos" element={<Productos />} />
        </Route>
      </Routes>
    </AccesoGate>
  );
}

export default App;
