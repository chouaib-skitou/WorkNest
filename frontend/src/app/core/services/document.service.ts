import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from "rxjs/operators"

// Interfaces for responses
export interface DocumentData {
  id: string;
  name: string;
  location: string;
}

export interface DocumentResponse {
  message: string;
  data: DocumentData;
}

export interface ListDocumentsResponse {
  message: string;
  data: {
    nextPageToken?: string;
    files: DocumentData[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  // Change the baseUrl to your API URL if different.
  private baseUrl = 'http://localhost:5002/api/documents';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = "An unknown error occurred"
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`
    }
    console.error(errorMessage)
    return throwError(() => new Error(errorMessage))
  }

  /**
   * Uploads a new document.
   * Expects a File object from a file input.
   * Returns an Observable with the document response.
   */
  createDocument(file: File): Observable<DocumentResponse> {
    const formData = new FormData()
    formData.append("file", file)

    return this.http.post<DocumentResponse>(this.baseUrl, formData).pipe(catchError(this.handleError))
  }

  /**
   * Updates an existing document.
   * You can provide a new File for content and/or a newName for renaming.
   * @param fileId - The current key/filename of the document.
   * @param file - Optional new File object.
   * @param newName - Optional new name.
   */
  updateDocument(
    fileId: string,
    file?: File,
    newName?: string
  ): Observable<DocumentResponse> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (newName) {
      formData.append('newName', newName);
    }
    return this.http.put<DocumentResponse>(
      `${this.baseUrl}/${fileId}`,
      formData
    );
  }

  /**
   * Deletes a document.
   * @param fileId - The key/filename of the document to delete.
   */
  deleteDocument(fileId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${fileId}`);
  }

  /**
   * (Optional) Lists documents with optional pagination.
   * @param pageSize - Number of documents per page.
   * @param pageToken - Continuation token for pagination.
   */
  listDocuments(
    pageSize?: number,
    pageToken?: string
  ): Observable<ListDocumentsResponse> {
    let params = new HttpParams();
    if (pageSize) {
      params = params.set('pageSize', pageSize.toString());
    }
    if (pageToken) {
      params = params.set('pageToken', pageToken);
    }
    return this.http.get<ListDocumentsResponse>(this.baseUrl, { params });
  }

  /**
   * (Optional) Retrieves metadata for a specific document.
   * @param fileId - The key/filename of the document.
   */
  getDocument(fileId: string): Observable<DocumentResponse> {
    return this.http.get<DocumentResponse>(`${this.baseUrl}/${fileId}`);
  }
}
