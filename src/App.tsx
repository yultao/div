import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
} from "@mui/icons-material";

type DataItem = {
  id: number;
  name?: string;
  email?: string;
};

function App() {
  const [option1, setOption1] = useState("users");
  const [option2, setOption2] = useState("all");

  const [data, setData] = useState<DataItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    try {
      const url = `https://jsonplaceholder.typicode.com/${option1}?_page=${page}&_limit=${pageSize}`;
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer YOUR_TOKEN_HERE", // replace with real token
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      setData(json);

      // Fake total since JSONPlaceholder doesn't return it in headers
      setTotal(50);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, option1, option2, pageSize]);

  const totalPages = Math.ceil(total / pageSize);

  // Define columns for DataGrid
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "name", headerName: "Name", width: 200, flex: 1 },
    { field: "email", headerName: "Email", width: 250, flex: 1 },
  ];

  return (
    <div className="flex justify-center items-start mt-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <select
          value={option1}
          onChange={(e) => setOption1(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="users">Users</option>
          <option value="posts">Posts</option>
          <option value="comments">Comments</option>
        </select>

        <select
          value={option2}
          onChange={(e) => setOption2(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>

        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Fetch Data
        </button>
      </div>

      {/* DataGrid */}
      <div style={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={data}
          columns={columns}
          rowCount={total}
          page={page - 1} // DataGrid uses 0-based pages
          pageSize={pageSize}
          paginationMode="server"
          onPageChange={(newPage: number) => setPage(newPage + 1)}
          onPageSizeChange={(newSize: number) => {
            setPageSize(newSize);
            setPage(1);
          }}
          rowsPerPageOptions={[5, 10, 20]}
          pagination
        />
      </div>

      {/* Custom pagination controls (optional) */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className="p-2 border rounded disabled:opacity-50"
        >
          <FirstPageIcon fontSize="small" />
        </button>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="p-2 border rounded disabled:opacity-50"
        >
          <PrevIcon fontSize="small" />
        </button>
        <span className="px-3">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="p-2 border rounded disabled:opacity-50"
        >
          <NextIcon fontSize="small" />
        </button>
        <button
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          className="p-2 border rounded disabled:opacity-50"
        >
          <LastPageIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
}

export default App;
