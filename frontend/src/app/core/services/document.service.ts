import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
  private baseUrl = environment.storageServiceUrl;

  constructor(private http: HttpClient) {}

  /**
   * Handles HTTP errors
   * @param error The error to process
   * @returns An error Observable
   */
  private handleError(error: unknown): Observable<never> {
    let errorMessage = 'An unknown error occurred while processing the document';
    
    if (typeof error === 'object' && error !== null) {
      // We can add more specific checks here
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      }
    }
    
    console.error('Document service error:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Uploads a new document.
   * Expects a File object from a file input.
   * Returns an Observable with the document response.
   */
  createDocument(file: File): Observable<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Use the observe: 'response' configuration to get the HTTP status
    return this.http
      .post<DocumentResponse>(this.baseUrl, formData, { observe: 'response' })
      .pipe(
        map(response => {
          // If we receive a 201 status, it's a success, even if the body is empty
          if (response.status === 201) {
            // Return a valid response object, even if the body is null
            return response.body || {
              message: 'Document uploaded successfully',
              data: {
                id: 'generated-id',
                name: file.name,
                location: 'document-location'
              }
            };
          }
          return response.body || {
            message: 'Unknown response',
            data: undefined as unknown as DocumentData
          };
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Updates an existing document
   * @param fileId ID of the document to update
   * @param file Optional new file content
   * @param newName Optional new name for the document
   * @returns Observable with the updated document response
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
   * Deletes a document
   * @param fileId ID of the document to delete
   * @returns Observable with the deletion confirmation
   */
  deleteDocument(fileId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${fileId}`);
  }

  /**
   * Lists all documents with optional pagination
   * @param pageSize Number of documents per page
   * @param pageToken Token for the next page
   * @returns Observable with the list of documents
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
   * Gets a single document by ID
   * @param fileId ID of the document to retrieve
   * @returns Observable with the document data
   */
  getDocument(fileId: string): Observable<DocumentResponse> {
    return this.http.get<DocumentResponse>(`${this.baseUrl}/${fileId}`);
  }
}