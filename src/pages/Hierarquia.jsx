import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import HierarchyTable from "../components/HierarchyTable";

export default function Hierarquia() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/hierarchy").then(res => setData(res.data));
  }, []);

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Hierarquia GATE</h1>
        {data ? <HierarchyTable data={data} /> : <p>Carregando...</p>}
      </div>
    </>
  );
}
