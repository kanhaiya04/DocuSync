import React, { useCallback, useContext } from "react";
import { Col } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import { useNavigate } from "react-router-dom";
import DocsContent from "../content/Docs/docsContent";

// Types
interface DocsCardProps {
  title: string;
  content: string;
  url: string;
  date?: string;
}

interface DocsContextType {
  deleteDoc: (id: string) => void;
}

const DocsCard: React.FC<DocsCardProps> = ({ title, content, url, date }) => {
  const { deleteDoc } = useContext(DocsContent) as DocsContextType;
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate(`/workspace/${url}`);
  }, [navigate, url]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when deleting
    try {
      await deleteDoc(url);
    } catch (error) {
      console.error("Delete error:", error);
    }
  }, [deleteDoc, url]);
  return (
    <Col xs={12} sm={6} md={4} className="mb-3">
      <Card className="h-100 shadow-sm">
        <Card.Body className="d-flex flex-column">
          <Card.Title 
            onClick={handleClick} 
            style={{ 
              cursor: "pointer",
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#0E2954"
            }}
            className="mb-2"
          >
            {title}
          </Card.Title>
          <div 
            onClick={handleClick} 
            style={{ 
              cursor: "pointer",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              color: "#6c757d"
            }}
            className="text-muted"
            dangerouslySetInnerHTML={{ 
              __html: content || "No content available" 
            }}
          />
          {date && (
            <small className="text-muted mb-2">
              {new Date(date).toLocaleDateString()}
            </small>
          )}
          <div className="d-flex justify-content-end">
            <button
              onClick={handleDelete}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "4px",
                color: "#dc3545"
              }}
              title="Delete document"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-trash3"
                viewBox="0 0 16 16"
              >
                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z" />
              </svg>
            </button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default DocsCard;
