import { Component, Input } from "@angular/core"
import { CommonModule } from "@angular/common"

@Component({
  selector: "app-alert",
  templateUrl: "./alert.component.html",
  styleUrls: ["./alert.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class AlertComponent {
  @Input() message = ""
  @Input() type: "error" | "success" = "error"
}

