import StartNode from "./StartNode";
import AuthNode from "./AuthNode";
import QuestionNode from "./QuestionNode";
import ConsentNode from "./ConsentNode";
import CheckoutNode from "./CheckoutNode";
import ProductNode from "./ProductNode";
import EndNode from "./EndNode";

export const nodeTypes = {
  start: StartNode,
  auth: AuthNode,
  question: QuestionNode,
  consent: ConsentNode,
  checkout: CheckoutNode,
  product: ProductNode,
  end: EndNode,
};
