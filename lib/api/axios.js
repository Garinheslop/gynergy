//axios
import axios from "axios";

export const axiosRequest = async (payload) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const { url, method, data, formData, headers } = payload;
  const response = await axios.request({
    baseURL: baseUrl,
    url,
    method,
    headers,
    data,
    formData,
  });
  return response;
};

export const fetchData = async (url, token, queryParameters, requestHeaders) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = {
    "x-auth-token": token ?? "",
    ...requestHeaders,
  };
  try {
    const res = await axios.get(`${baseUrl}${url}?${queryParameters}`, { headers });
    return res.data;
  } catch (error) {
    return { error };
  }
};
export const searchData = async (token, url, text) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const headers = {
    "x-auth-token": token,
  };
  try {
    const res = await axios.get(
      `${baseUrl}${url}`,
      { searchedText: text },
      { headers: headers, withCredentials: true }
    );
    return res.data;
  } catch (error) {
    return { error };
  }
};

export const postData = async (url, data, token, requestHeaders, cancelToken) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = {
    "x-auth-token": token ?? "",
    ...requestHeaders,
  };

  try {
    const res = await axios.post(`${baseUrl}${url}`, data, { headers: headers }, cancelToken);
    return res.data;
  } catch (error) {
    return { error };
  }
};

export const updateData = async (url, data, token) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = {
    "x-auth-token": token,
  };

  try {
    const res = await axios.put(`${baseUrl}${url}`, data, { headers: headers });
    return res.data;
  } catch (error) {
    return { error };
  }
};

export const deleteData = async (url, data, token) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = {
    "x-auth-token": token,
  };

  try {
    const res = await axios.delete(`${baseUrl}${url}`, data, {
      headers: headers,
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    return { error };
  }
};
export const uploadImage = async (token, url, imageType, data) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const headers = {
    "x-auth-token": token,
  };

  try {
    const res = await axios.post(`${baseUrl}${url}/${imageType}`, data, {
      headers: headers,
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    return { error };
  }
};
export const validationApi = async (token, url, urlId) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = {
    "x-auth-token": token,
  };

  return axios
    .get(`${baseUrl}${url}?${urlId}`, { headers: headers }, { withCredentials: true })
    .then((response) => response.data);
};
