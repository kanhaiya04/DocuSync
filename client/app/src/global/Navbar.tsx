import { useContext, useEffect } from "react";
import { Button, Dropdown, Nav, DropdownButton } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import { useNavigate } from "react-router-dom";
import userContext from "../content/Users/usersContent";
import { PersonFill } from "react-bootstrap-icons";
import DocsContent from "../content/Docs/docsContent";
function NavBar(props: any) {
  let navigator = useNavigate();
  const ipcRendener = (window as any).ipcRenderer;
  const { users, getUser } = useContext(userContext);
  const { emptyDoc } = useContext(DocsContent);
  useEffect(() => {
    getUser();
  }, [getUser]);

  const returnBack = () => {
    navigator("/");
  };
  const handleLogOut = () => {
    ipcRendener.send("key:set", {
      token: null,
    });
    emptyDoc();
    navigator("/login");
  };
  return (
    <Navbar style={{ backgroundColor: "#0E2954" }}>
      <Container>
        <Navbar.Brand style={{ color: "white", fontWeight: "bold" }}>
          {props.title === "Workspace" ? (
            <span className="pe-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                fill="currentColor"
                className="bi bi-arrow-left-circle-fill"
                viewBox="0 0 16 16"
                onClick={returnBack}
                style={{cursor:"pointer"}}
              >
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z" />
              </svg>
            </span>
          ) : (
            ""
          )}
          {props.title}
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Nav>
            <DropdownButton
              align="end"
              title={<PersonFill size={30} color="white" />}
              id="dropdown-menu-align-end"
              className="user_profile"
            >
              <Dropdown.ItemText style={{textAlign:"center"}}>
                Hello, {users[0] ? users[0].name : ""}
              </Dropdown.ItemText>
              <Dropdown.ItemText style={{textAlign:"center"}}>
                <Button  onClick={handleLogOut}>
                  Logout
                </Button>
              </Dropdown.ItemText>
            </DropdownButton>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;
