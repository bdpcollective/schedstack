const SOAP_ACTION =
  "http://edupoint.com/webservices/ProcessWebServiceRequest";

function buildSoapEnvelope(
  methodName: string,
  paramStr: string
): string {
  const username = process.env.PARENTVUE_USERNAME!;
  const password = process.env.PARENTVUE_PASSWORD!;

  const encodedParams = paramStr
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ProcessWebServiceRequest xmlns="http://edupoint.com/webservices/">
      <userID>${username}</userID>
      <password>${password}</password>
      <skipLoginLog>1</skipLoginLog>
      <parent>1</parent>
      <webServiceHandleName>PXPWebServices</webServiceHandleName>
      <methodName>${methodName}</methodName>
      <paramStr>${encodedParams}</paramStr>
    </ProcessWebServiceRequest>
  </soap:Body>
</soap:Envelope>`;
}

export async function callParentVue(
  methodName: string,
  childIntID: number,
  extraParams: Record<string, string> = {}
): Promise<string> {
  const baseUrl = process.env.PARENTVUE_URL!;
  const endpoint = `${baseUrl}/Service/PXPCommunication.asmx`;

  const extraXml = Object.entries(extraParams)
    .map(([k, v]) => `<${k}>${v}</${k}>`)
    .join("");

  const paramStr = `<Parms><ChildIntID>${childIntID}</ChildIntID>${extraXml}</Parms>`;
  const envelope = buildSoapEnvelope(methodName, paramStr);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: SOAP_ACTION,
    },
    body: envelope,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ParentVUE HTTP ${response.status}: ${response.statusText}`);
  }

  return response.text();
}
