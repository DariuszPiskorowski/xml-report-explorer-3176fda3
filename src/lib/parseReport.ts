export interface TestStep {
  id: string;
  atsId: string;
  name: string;
  description: string;
  serviceMethod: string;
  serviceMethodVar: string;
  evaluationMethod: string;
  expectedValue: string;
  expectedValueVar: string;
  returnValue: string;
  clientMethod: string;
  error: string;
  hasError: boolean;
  statusCode: string;
  statusText: "Pass" | "Fail" | "Skipped" | "Warning" | "Unknown" | "Running";
  timeStamp: string;
  tstId: string;
  timePoint: string;
  elapsedTime: string;
}

export const statusMap = (code: string): TestStep["statusText"] => {
  switch (code?.trim()) {
    case "2": return "Pass";
    case "8": return "Skipped";
    case "16": return "Fail";
    case "4": return "Warning";
    case "0": return "Unknown";
    case "1": return "Running";
    default: return "Unknown";
  }
};

const text = (el: Element | null, tag: string): string => {
  const n = el?.getElementsByTagName(tag)?.[0];
  return (n?.textContent ?? "").trim();
};

export function parseReportXml(xml: string): TestStep[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const err = doc.getElementsByTagName("parsererror")[0];
  if (err) throw new Error("Invalid XML file");

  const nodes = Array.from(doc.getElementsByTagName("AtomicTestStep"));
  if (nodes.length === 0) throw new Error("No <AtomicTestStep> elements found in the file.");

  return nodes.map((n) => {
    const statusCode = text(n, "Status");
    const error = text(n, "Error");
    return {
      id: text(n, "ID"),
      atsId: text(n, "ATS_Id"),
      name: text(n, "Name"),
      description: text(n, "Description"),
      serviceMethod: text(n, "ServiceMethod"),
      serviceMethodVar: text(n, "ServiceMethodVar"),
      evaluationMethod: text(n, "EvaluationMethod"),
      expectedValue: text(n, "ExpectedValue"),
      expectedValueVar: text(n, "ExpectedValueVar"),
      returnValue: text(n, "ReturnValue"),
      clientMethod: text(n, "ClientMethod"),
      error,
      hasError: error.length > 0,
      statusCode,
      statusText: statusMap(statusCode),
      timeStamp: text(n, "TimeStamp"),
      tstId: text(n, "TST_Id"),
      timePoint: text(n, "TimePoint"),
      elapsedTime: text(n, "ElapsedTime"),
    };
  });
}
