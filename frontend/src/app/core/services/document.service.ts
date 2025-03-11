import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  private baseUrl = 'http://localhost:5002/api/documents';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    // Si l'erreur a un statut 201, ce n'est pas réellement une erreur
    if (error.status === 201) {
      console.log('Received 201 status with error handling');
      return of({
        message: 'Document uploaded successfully',
        data: {
          id: 'temp-id',
          name: 'document',
          location: 'document-location'
        }
      });
    }
    
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
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

    // Utiliser la configuration observe: 'response' pour obtenir le statut HTTP
    return this.http
      .post<any>(this.baseUrl, formData, { observe: 'response' })
      .pipe(
        map(response => {
          // Si nous recevons un statut 201, c'est un succès, même si le corps est vide
          if (response.status === 201) {
            // Retourner un objet de réponse valide, même si le corps est null
            return response.body || {
              message: 'Document uploaded successfully',
              data: {
                id: 'generated-id',
                name: file.name,
                location: 'document-location'
              }
            };
          }
          return response.body;
        }),
        catchError(this.handleError)
      );
  }

  // Le reste du service reste inchangé
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

  deleteDocument(fileId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${fileId}`);
  }

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

  getDocument(fileId: string): Observable<DocumentResponse> {
    return this.http.get<DocumentResponse>(`${this.baseUrl}/${fileId}`);
  }
}