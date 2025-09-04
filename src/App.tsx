import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { Graphite } from "graphite";
import "./App.css"
import "graphite/dist/graphite.css";
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
function convertDataToER(jsonObj: Record<string, any>): { type: string; nodes: Array<{ id: string; name: string; type: string; description: string }>; edges: Array<{ source: string; target: string; weight: string }> } {
    const result: {
        type: string;
        nodes: Array<{ id: string; name: string; type: string; description: string }>;
        edges: Array<{ source: string; target: string; weight: string }>;
    } = { type: "er", nodes: [], edges: [] };

    function makeNode(entity: string, entityId: string, key: string, type: string, description: string) {
        result.nodes.push({
            id: `${entity}.${entityId}.${key}`,
            name: key,
            type,
            description
        });
    }

    function processEntity(entity: string, entityId: string, obj: Record<string, any>) {
        const separateNodeForArray = false;
        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined) continue;

            if (typeof value !== "object" || (Array.isArray(value) === false && typeof value !== "object")) {
                // primitive field
                makeNode(entity, entityId, key, typeof value, String(value));
            } else if (Array.isArray(value)) {
                // array of objects
                makeNode(entity, entityId, key, `[${key}]`, "[{...}]");

                if (separateNodeForArray) {
                    // create an edge from parent entity to the array field
                    let linkedToArray = false;
                    value.forEach((item, idx) => {
                        const childEntity = key.toUpperCase(); // e.g. addresses -> ADDRESS
                        const childId = item.id || `${childEntity}${idx + 1}`;

                        makeNode(`[${childEntity}]`, entityId, childId, `[${childId}]`, "[{...}]");

                        // PARENT -> ARRAY
                        if (!linkedToArray) {
                            result.edges.push({
                                source: `${entity}.${entityId}.${key}`,
                                target: `[${childEntity}].${entityId}.${childId}`,
                                weight: "has"
                            });
                            linkedToArray = true;
                        }
                    });
                }

                // each item in the array is a separate entity
                value.forEach((item, idx) => {
                    const childEntity = key.toUpperCase(); // e.g. addresses -> ADDRESS
                    const childId = item.id || `${childEntity}${idx + 1}`;

                    if (separateNodeForArray) {
                        // ARRAY -> ITEM
                        result.edges.push({
                            source: `[${childEntity}].${entityId}.${childId}`,
                            target: `${childEntity}.${childId}.id`,
                            weight: "contains"
                        });
                        processEntity(childEntity, childId, item);
                    } else {
                        result.edges.push({
                            source: `${entity}.${entityId}.${key}`,
                            target: `${childEntity}.${childId}.id`,
                            weight: "has"
                        });
                        processEntity(childEntity, childId, item);
                    }
                });
            } else {
                // nested object
                makeNode(entity, entityId, key, key[0].toUpperCase() + key.slice(1), "{...}");

                const childEntity = key.toUpperCase();
                const childId = value.id || `${childEntity}001`;
                result.edges.push({
                    source: `${entity}.${entityId}.${key}`,
                    target: `${childEntity}.${childId}.id`,
                    weight: "has"
                });
                processEntity(childEntity, childId, value);
            }
        }
    }

    // entry point: assume root objects are entities
    for (const [rootKey, rootVal] of Object.entries(jsonObj)) {
        const entity = rootKey.toUpperCase().replace(/s$/, ""); // plural -> singular
        if (Array.isArray(rootVal)) {
            rootVal.forEach((item, idx) => {
                const entityId = item.id || `${entity}${idx + 1}`;
                processEntity(entity, entityId, item);
            });
        } else if (typeof rootVal === "object") {
            const entityId = rootVal.id || `${entity}001`;
            processEntity(entity, entityId, rootVal);
        }
    }

    return result;
}
function App() {
  const [option1, setOption1] = useState("users");
  const [option2, setOption2] = useState("all");

  const [data, setData] = useState<DataItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    try {
      //option 1 cors issue only happens when requesting from browser to another server in a different origin
      //browser     ->      real server in another origin
      //    (CORS issue)
      //broswer     ->      vite server       ->          real server in another origin
      //   (no cors issue same origin)  (no cors issue, becuase server to server)

      const url = `/apiproxy/${option1}?_page=${page}&_limit=${pageSize}`;
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
    // fetchData();
  }, [page, option1, option2, pageSize]);

  const totalPages = Math.ceil(total / pageSize);

  // Define columns for DataGrid
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "name", headerName: "Name", width: 200, flex: 1 },
    { field: "email", headerName: "Email", width: 250, flex: 1 },
  ];


  const json = `
{
  "user": {
    "id": "USR001",
    "addresses": [
      {
        "type": "home",
        "street": "123 Main St",
        "city": "Anytown",
        "zipCode": "12345"
      },
      {
        "type": "work",
        "street": "456 Business Ave",
        "city": "Metropolis",
        "zipCode": "67890"
      }
    ],
    "preferences": {
      "newsletter": true,
      "notifications": {
        "email": true,
        "sms": false
      }
    },
    "orderHistory": [
      {
        "orderId": "ORD001",
        "date": "2025-08-15",
        "items": [
          {
            "id": "ITEM001",
            "productId": "PROD001",
            "name": "Laptop",
            "quantity": 1,
            "price": 1200
          },
          {
            "id": "ITEM002",
            "productId": "PROD003",
            "name": "Mouse",
            "quantity": 2,
            "price": 25
          }
        ],
        "totalAmount": 1250
      },
      {
        "orderId": "ORD002",
        "date": "2025-09-01",
        "items": [
          {
            "id": "ITEM003",
            "productId": "PROD005",
            "name": "Keyboard",
            "quantity": 1,
            "price": 75
          }
        ],
        "totalAmount": 75
      }
    ]
    
  }
}
`;
  /*
  
  */
  const jsonData = JSON.stringify(convertDataToER(JSON.parse(json)))
  console.log(jsonData);
  
  return (
    <div style={{ width: "800px", height:"400px", border: "1px gray solid" }} className="p-10">

      <Graphite jsonString={jsonData} />
      <div className="flex justify-center items-start mt-10">
        {/* Header */}
        {/* <div className="flex items-center gap-4">
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
      </div> */}

        {/* DataGrid */}
        {/* <div style={{ height: 400, width: "100%" }}>
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
        </div> */}

        {/* Custom pagination controls (optional) */}
        {/* <div className="flex items-center gap-2 mt-2">
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
        </div> */}
      </div>
    </div>
  );
}

export default App;
