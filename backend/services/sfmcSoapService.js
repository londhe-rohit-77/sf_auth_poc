/**
 * Salesforce Marketing Cloud SOAP API Service
 * Comprehensive SOAP operations with pagination support
 */

const sfmcTokenStore = require('./sfmcTokenStore');

// ─── XML Helpers ─────────────────────────────────────────────────────────────

function extractValue(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function extractBlocks(xml, tag) {
  const blocks = [];
  const closeTag = `</${tag}>`;
  let pos = 0;

  while (pos < xml.length) {
    const start = xml.indexOf(`<${tag}`, pos);
    if (start === -1) break;
    const end = xml.indexOf(closeTag, start);
    if (end === -1) break;
    blocks.push(xml.substring(start, end + closeTag.length));
    pos = end + closeTag.length;
  }

  return blocks;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── SOAP Request Builder ─────────────────────────────────────────────────────

function buildEnvelope(token, objectType, properties, continueRequest) {
  const propXml = properties
    .map((p) => `<Properties>${escapeXml(p)}</Properties>`)
    .join('\n        ');

  const innerRequest = continueRequest
    ? `<ContinueRequest>${escapeXml(continueRequest)}</ContinueRequest>`
    : `<ObjectType>${escapeXml(objectType)}</ObjectType>
        ${propXml}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soap:Header>
    <fueloauth xmlns="http://exacttarget.com">${token}</fueloauth>
  </soap:Header>
  <soap:Body>
    <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">
      <RetrieveRequest>
        ${innerRequest}
      </RetrieveRequest>
    </RetrieveRequestMsg>
  </soap:Body>
</soap:Envelope>`;
}

async function soapPost(soapUrl, envelope, soapAction = 'Retrieve') {
  const axios = require('axios');
  
  const response = await axios.post(`${soapUrl}/Service.asmx`, envelope, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': soapAction,
    }
  });

  return response.data;
}

// ─── Paginated Retrieve ───────────────────────────────────────────────────────

async function soapRetrieveAll(accountId, objectType, properties) {
  const accountData = sfmcTokenStore.get(accountId);
  if (!accountData) {
    throw new Error(`SFMC account not connected: ${accountId}`);
  }

  const allBlocks = [];
  let continueRequest;

  do {
    const envelope = buildEnvelope(accountData.accessToken, objectType, properties, continueRequest);
    const xml = await soapPost(accountData.soapInstanceUrl, envelope);

    const overallStatus = extractValue(xml, 'OverallStatus');
    const requestId = extractValue(xml, 'RequestID');
    const blocks = extractBlocks(xml, 'Results');

    allBlocks.push(...blocks);
    console.log(`🧼 [SOAP] ${objectType}: fetched ${blocks.length} records, status=${overallStatus}`);

    if (overallStatus === 'Error') {
      const statusMsg = extractValue(xml, 'StatusMessage');
      throw new Error(`SOAP retrieve error for ${objectType}: ${statusMsg || xml.substring(0, 500)}`);
    }

    continueRequest = overallStatus === 'MoreDataAvailable' ? requestId : undefined;
  } while (continueRequest);

  return allBlocks;
}

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Fetch all Data Extensions metadata
 */
async function fetchAllDataExtensions(accountId) {
  const blocks = await soapRetrieveAll(accountId, 'DataExtension', ['Name', 'CustomerKey']);

  return blocks
    .map((block) => ({
      name: extractValue(block, 'Name'),
      customerKey: extractValue(block, 'CustomerKey'),
    }))
    .filter((de) => de.name && de.customerKey);
}

/**
 * Fetch all Data Extension fields
 */
async function fetchAllFields(accountId) {
  const blocks = await soapRetrieveAll(accountId, 'DataExtensionField', [
    'Name',
    'FieldType',
    'IsRequired',
    'IsPrimaryKey',
    'DataExtension.CustomerKey',
  ]);

  return blocks
    .map((block) => ({
      name: extractValue(block, 'Name'),
      fieldType: extractValue(block, 'FieldType'),
      isRequired: extractValue(block, 'IsRequired').toLowerCase() === 'true',
      isPrimaryKey: extractValue(block, 'IsPrimaryKey').toLowerCase() === 'true',
      deCustomerKey: extractValue(block, 'CustomerKey'),
    }))
    .filter((f) => f.name && f.deCustomerKey);
}

/**
 * Fetch all subscribers
 */
async function fetchAllSubscribers(accountId) {
  const blocks = await soapRetrieveAll(accountId, 'Subscriber', [
    'SubscriberKey',
    'EmailAddress',
    'Status',
    'DateJoined',
  ]);

  return blocks
    .map((block) => ({
      subscriberKey: extractValue(block, 'SubscriberKey'),
      emailAddress: extractValue(block, 'EmailAddress'),
      status: extractValue(block, 'Status'),
      dateJoined: extractValue(block, 'DateJoined'),
    }))
    .filter((sub) => sub.subscriberKey || sub.emailAddress);
}

// ─── DE Row Query ─────────────────────────────────────────────────────────────

const SOAP_OPERATOR_MAP = {
  eq: 'equals',
  neq: 'notEquals',
  gt: 'greaterThan',
  lt: 'lessThan',
  like: 'like',
};

function buildDeQueryEnvelope(token, deExternalKey, fieldNames, filter) {
  const propsXml = fieldNames
    .map((f) => `<Properties>${escapeXml(f)}</Properties>`)
    .join('\n        ');

  const filterXml = filter
    ? `<Filter xsi:type="SimpleFilterPart">
          <Property>${escapeXml(filter.field)}</Property>
          <SimpleOperator>${escapeXml(SOAP_OPERATOR_MAP[filter.operator] || 'equals')}</SimpleOperator>
          <Value>${escapeXml(filter.value)}</Value>
        </Filter>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soap:Header>
    <fueloauth xmlns="http://exacttarget.com">${token}</fueloauth>
  </soap:Header>
  <soap:Body>
    <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">
      <RetrieveRequest>
        <ObjectType>DataExtensionObject[${escapeXml(deExternalKey)}]</ObjectType>
        ${propsXml}
        ${filterXml}
      </RetrieveRequest>
    </RetrieveRequestMsg>
  </soap:Body>
</soap:Envelope>`;
}

/**
 * Query rows from a specific Data Extension
 */
async function queryDeRows(accountId, deExternalKey, fieldNames, filter) {
  const accountData = sfmcTokenStore.get(accountId);
  if (!accountData) {
    throw new Error(`SFMC account not connected: ${accountId}`);
  }

  const allRows = [];
  let continueRequestId;

  do {
    let envelope;
    if (continueRequestId) {
      envelope = buildEnvelope(accountData.accessToken, '', [], continueRequestId);
    } else {
      envelope = buildDeQueryEnvelope(accountData.accessToken, deExternalKey, fieldNames, filter);
    }

    const xml = await soapPost(accountData.soapInstanceUrl, envelope);
    const overallStatus = extractValue(xml, 'OverallStatus');
    const requestId = extractValue(xml, 'RequestID');

    if (overallStatus === 'Error') {
      const faultString = extractValue(xml, 'faultstring');
      const statusMsg = extractValue(xml, 'StatusMessage');
      throw new Error(`SOAP query error: ${faultString || statusMsg || xml.substring(0, 400)}`);
    }

    const resultBlocks = extractBlocks(xml, 'Results');
    for (const block of resultBlocks) {
      const row = {};
      const propBlocks = extractBlocks(block, 'Property');
      for (const prop of propBlocks) {
        const name = extractValue(prop, 'Name');
        const value = extractValue(prop, 'Value');
        if (name) row[name] = value;
      }
      if (Object.keys(row).length > 0) allRows.push(row);
    }

    console.log(`🧼 [SOAP] DE rows: fetched ${resultBlocks.length} records, status=${overallStatus}`);
    continueRequestId = overallStatus === 'MoreDataAvailable' ? requestId : undefined;
  } while (continueRequestId);

  return allRows;
}

module.exports = {
  fetchAllDataExtensions,
  fetchAllFields,
  fetchAllSubscribers,
  queryDeRows,
  extractValue,
  extractBlocks,
  escapeXml
};
